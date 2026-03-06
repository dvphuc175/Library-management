const db = require('../config/db');

class PhieuMuonModel {
    // Hàm xử lý Mượn Sách (Dùng Transaction)
    static async taoPhieuMuon(nguoiDungId, maVach, ngayMuon, hanTra) {
        // Lấy một connection riêng biệt từ pool để chạy transaction
        const connection = await db.getConnection();
        
        try {
            // 1. Bắt đầu Giao dịch
            await connection.beginTransaction();

            // 2. Kiểm tra trạng thái bản sao sách CÓ SẴN không? (Quan trọng: dùng FOR UPDATE để khoá dòng này lại, tránh 2 người cùng mượn 1 lúc)
            const [banSao] = await connection.query(
                'SELECT maDauSach, trangThai FROM BanSaoSach WHERE maVach = ? FOR UPDATE', 
                [maVach]
            );

            if (banSao.length === 0) {
                throw new Error('Không tìm thấy mã vạch sách này!');
            }
            if (banSao[0].trangThai !== 'CO_SAN') {
                throw new Error('Sách này hiện không có sẵn để mượn!');
            }

            const maDauSach = banSao[0].maDauSach;

            // 3. Tạo phiếu mượn mới
            const sqlInsertPhieu = `
                INSERT INTO PhieuMuon (nguoiDungId, maVach, ngayMuon, hanTra, trangThai) 
                VALUES (?, ?, ?, ?, 'DANG_MUON')
            `;
            const [result] = await connection.query(sqlInsertPhieu, [nguoiDungId, maVach, ngayMuon, hanTra]);

            // 4. Cập nhật trạng thái bản sao thành DANG_MUON
            await connection.query(
                'UPDATE BanSaoSach SET trangThai = "DANG_MUON" WHERE maVach = ?', 
                [maVach]
            );

            // 5. Cập nhật giảm số lượng tổng của Đầu sách (-1)
            // Lưu ý: Tùy vào thiết kế, nếu bạn dùng 'tongSoLuong' làm tổng sách thư viện sở hữu thì không trừ. 
            // Ở đây tôi giả định bạn muốn trừ đi số lượng sách hiện có trên kệ (như gợi ý trước đó).
            await connection.query(
                'UPDATE DauSach SET tongSoLuong = GREATEST(tongSoLuong - 1, 0) WHERE maDauSach = ?', 
                [maDauSach]
            );

            // 6. Hoàn tất giao dịch (Lưu tất cả vào DB)
            await connection.commit();
            return result.insertId; // Trả về ID của phiếu mượn vừa tạo

        } catch (error) {
            // Nếu có LỖI ở bất kỳ dòng nào ở trên -> Hủy toàn bộ (Rollback)
            await connection.rollback();
            throw error; // Ném lỗi ra cho Controller xử lý
        } finally {
            // Trả connection lại cho pool
            connection.release();
        }
    }
}

module.exports = PhieuMuonModel;
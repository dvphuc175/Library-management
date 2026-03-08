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
    
    // Hàm xử lý Trả Sách (Dùng Transaction)
    static async traSach(maVach) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Tìm phiếu mượn đang 'DANG_MUON' của mã vạch này
            const [phieu] = await connection.query(
                `SELECT id, hanTra FROM PhieuMuon WHERE maVach = ? AND trangThai = 'DANG_MUON' FOR UPDATE`, 
                [maVach]
            );

            if (phieu.length === 0) {
                throw new Error('Không tìm thấy phiếu mượn nào đang active cho mã vạch này!');
            }

            const phieuId = phieu[0].id;

            // 2. Lấy mã đầu sách để lát nữa cộng số lượng
            const [banSao] = await connection.query(
                `SELECT maDauSach FROM BanSaoSach WHERE maVach = ?`, 
                [maVach]
            );
            const maDauSach = banSao[0].maDauSach;

            // 3. Cập nhật phiếu mượn thành DA_TRA và ghi nhận ngày trả
            await connection.query(
                `UPDATE PhieuMuon SET ngayTra = CURDATE(), trangThai = 'DA_TRA' WHERE id = ?`, 
                [phieuId]
            );

            // 4. Cập nhật bản sao sách thành CO_SAN
            await connection.query(
                `UPDATE BanSaoSach SET trangThai = 'CO_SAN' WHERE maVach = ?`, 
                [maVach]
            );

            // 5. Cập nhật tăng số lượng đầu sách (+1)
            await connection.query(
                `UPDATE DauSach SET tongSoLuong = tongSoLuong + 1 WHERE maDauSach = ?`, 
                [maDauSach]
            );

            await connection.commit();
            return phieuId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    // Lấy lịch sử mượn sách của 1 cá nhân (Kèm theo tên sách từ bảng DauSach)
    static async getLichSuCaNhan(nguoiDungId) {
        const sql = `
            SELECT pm.id, pm.maVach, ds.tenSach, pm.ngayMuon, pm.hanTra, pm.ngayTra, pm.trangThai
            FROM PhieuMuon pm
            JOIN BanSaoSach bs ON pm.maVach = bs.maVach
            JOIN DauSach ds ON bs.maDauSach = ds.maDauSach
            WHERE pm.nguoiDungId = ?
            ORDER BY pm.ngayMuon DESC
        `;
        const [rows] = await db.query(sql, [nguoiDungId]);
        return rows;
    }
}



module.exports = PhieuMuonModel;
const db = require('../config/db');

class PhieuMuonModel {
    // Hàm xử lý Mượn Sách (Dùng Transaction)
    static async taoPhieuMuon(maVach, nguoiDungId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction(); // Bắt đầu giao dịch an toàn

            // 1. Kiểm tra sách có tồn tại không
            const [banSao] = await connection.query('SELECT maDauSach, trangThai FROM BanSaoSach WHERE maVach = ?', [maVach]);
            
            if (banSao.length === 0) {
                throw new Error('Mã vạch không tồn tại trong hệ thống!');
            }

            const trangThaiSach = banSao[0].trangThai;
            const maDauSach = banSao[0].maDauSach;

            // ==========================================
            // 🛡️ BỨC TƯỜNG LỬA CHỐNG CƯỚP SÁCH
            // ==========================================
            if (trangThaiSach === 'DANG_GIU_CHO') {
                // Sách đang nằm trên Kệ Giữ Chỗ -> Truy vấn xem ID người này có đúng là người đã đặt trước cuốn này không?
                const [datTruoc] = await connection.query(
                    'SELECT id FROM DatTruoc WHERE nguoiDungId = ? AND maDauSach = ? AND trangThai = "DA_CO_SACH"',
                    [nguoiDungId, maDauSach]
                );
                
                // Nếu không tìm thấy phiếu đặt trước hợp lệ -> Đuổi về ngay lập tức!
                if (datTruoc.length === 0) {
                    throw new Error('Từ chối cho mượn! Cuốn sách này đã được xếp vào Kệ Giữ Chỗ cho một độc giả khác.');
                }
                
                // Nếu ĐÚNG là người đó -> Cho qua và ĐÓNG phiếu đặt trước lại
                await connection.query('UPDATE DatTruoc SET trangThai = "HOAN_THANH" WHERE id = ?', [datTruoc[0].id]);

            } else if (trangThaiSach !== 'CO_SAN') {
                // Nếu sách bị Hư hỏng, Mất, hoặc đang cho người khác mượn
                throw new Error(`Từ chối cho mượn! Sách hiện đang ở trạng thái: ${trangThaiSach}`);
            }
            // ==========================================

            // 2. Tạo phiếu mượn (Ví dụ: hạn trả mặc định 14 ngày)
            const hanTra = new Date();
            hanTra.setDate(hanTra.getDate() + 14);

            const [result] = await connection.query(
                'INSERT INTO PhieuMuon (nguoiDungId, maVach, ngayMuon, hanTra, trangThai) VALUES (?, ?, NOW(), ?, "DANG_MUON")',
                [nguoiDungId, maVach, hanTra]
            );

            // 3. Cập nhật trạng thái bản sao sách thành DANG_MUON
            await connection.query('UPDATE BanSaoSach SET trangThai = "DANG_MUON" WHERE maVach = ?', [maVach]);

            await connection.commit(); // Hoàn tất giao dịch
            
            return {
                phieuMuonId: result.insertId,
                hanTra: hanTra.toLocaleDateString('vi-VN')
            };
        } catch (error) {
            await connection.rollback(); // Nếu có bất kỳ lỗi gì ở trên -> Hủy toàn bộ, không lưu gì vào DB
            throw error; // Ném lỗi ra cho Controller xử lý
        } finally {
            connection.release(); // Trả kết nối lại cho hệ thống
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

    static async getAll() {
        const sql = `
            SELECT pm.id, pm.maVach, ds.tenSach, nd.hoTen, pm.ngayMuon, pm.hanTra, pm.ngayTra, pm.trangThai
            FROM PhieuMuon pm
            JOIN BanSaoSach bs ON pm.maVach = bs.maVach
            JOIN DauSach ds ON bs.maDauSach = ds.maDauSach
            JOIN NguoiDung nd ON pm.nguoiDungId = nd.id
            ORDER BY pm.ngayMuon DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }
}



module.exports = PhieuMuonModel;
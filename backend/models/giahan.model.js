const db = require('../config/db');

class GiaHanModel {
    // 1. DÀNH CHO ĐỘC GIẢ: Tạo yêu cầu gia hạn
    static async taoYeuCau(phieuMuonId, soNgayGiaHan, lyDo) {
        // Kiểm tra xem phiếu mượn có tồn tại và đang mượn không
        const [phieu] = await db.query('SELECT trangThai FROM PhieuMuon WHERE id = ?', [phieuMuonId]);
        if (phieu.length === 0 || phieu[0].trangThai !== 'DANG_MUON') {
            throw new Error('Phiếu mượn không hợp lệ hoặc sách đã được trả.');
        }

        // Kiểm tra xem phiếu này có yêu cầu nào đang chờ duyệt không (tránh spam)
        const [yeuCauCu] = await db.query(
            'SELECT id FROM GiaHan WHERE phieuMuonId = ? AND trangThai = "CHO_DUYET"', 
            [phieuMuonId]
        );
        if (yeuCauCu.length > 0) {
            throw new Error('Đang có yêu cầu gia hạn chờ duyệt cho phiếu mượn này rồi.');
        }

        const sql = `INSERT INTO GiaHan (phieuMuonId, soNgayGiaHan, lyDo, trangThai) VALUES (?, ?, ?, 'CHO_DUYET')`;
        const [result] = await db.query(sql, [phieuMuonId, soNgayGiaHan, lyDo]);
        return result.insertId;
    }

    // 2. DÀNH CHO THỦ THƯ: Duyệt hoặc Từ chối yêu cầu
    static async xuLyYeuCau(giaHanId, trangThaiMoi) {
        // trangThaiMoi sẽ là 'DA_DUYET' hoặc 'TU_CHOI'
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // Cập nhật trạng thái trong bảng GiaHan
            await connection.query(
                'UPDATE GiaHan SET trangThai = ? WHERE id = ?', 
                [trangThaiMoi, giaHanId]
            );

            // Nếu Thủ thư DUYỆT -> Cộng thêm ngày vào hạn trả của bảng PhieuMuon
            if (trangThaiMoi === 'DA_DUYET') {
                // Lấy thông tin số ngày gia hạn và ID phiếu mượn
                const [thongTin] = await connection.query(
                    'SELECT phieuMuonId, soNgayGiaHan FROM GiaHan WHERE id = ?', 
                    [giaHanId]
                );
                
                if (thongTin.length > 0) {
                    const { phieuMuonId, soNgayGiaHan } = thongTin[0];
                    // Dùng hàm DATE_ADD của MySQL để cộng thêm ngày
                    await connection.query(
                        'UPDATE PhieuMuon SET hanTra = DATE_ADD(hanTra, INTERVAL ? DAY) WHERE id = ?', 
                        [soNgayGiaHan, phieuMuonId]
                    );
                }
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = GiaHanModel;
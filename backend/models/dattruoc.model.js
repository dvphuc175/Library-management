const db = require('../config/db');

class DatTruocModel {
    // 1. DÀNH CHO ĐỘC GIẢ: Đặt trước một đầu sách
    static async taoDatTruoc(nguoiDungId, maDauSach) {
        // Kiểm tra xem đầu sách có tồn tại không
        const [sach] = await db.query('SELECT maDauSach FROM DauSach WHERE maDauSach = ?', [maDauSach]);
        if (sach.length === 0) {
            throw new Error('Đầu sách không tồn tại.');
        }

        // Kiểm tra xem độc giả này đã đặt trước cuốn này và đang chờ chưa (tránh spam)
        const [daDat] = await db.query(
            'SELECT id FROM DatTruoc WHERE nguoiDungId = ? AND maDauSach = ? AND trangThai = "CHO"',
            [nguoiDungId, maDauSach]
        );
        if (daDat.length > 0) {
            throw new Error('Bạn đã đặt trước cuốn sách này và đang trong hàng đợi rồi.');
        }

        const sql = `INSERT INTO DatTruoc (nguoiDungId, maDauSach, trangThai) VALUES (?, ?, 'CHO')`;
        const [result] = await db.query(sql, [nguoiDungId, maDauSach]);
        return result.insertId;
    }

    // 2. DÀNH CHO THỦ THƯ: Cập nhật trạng thái (khi có sách hoặc khi độc giả hủy)
    static async capNhatTrangThai(datTruocId, trangThaiMoi) {
        // trangThaiMoi: 'DA_CO_SACH' hoặc 'HUY'
        const sql = 'UPDATE DatTruoc SET trangThai = ? WHERE id = ?';
        const [result] = await db.query(sql, [trangThaiMoi, datTruocId]);
        
        if (result.affectedRows === 0) {
            throw new Error('Không tìm thấy phiếu đặt trước này.');
        }
        return true;
    }
}

module.exports = DatTruocModel;
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


// 2. DÀNH CHO THỦ THƯ: Cập nhật trạng thái (Bắt buộc check kho nếu báo DA_CO_SACH)
    static async capNhatTrangThai(datTruocId, trangThaiMoi) {
        // Lấy thông tin phiếu đặt trước để biết Độc giả đang đặt cuốn (maDauSach) nào
        const [thongTinDat] = await db.query('SELECT maDauSach FROM DatTruoc WHERE id = ?', [datTruocId]);
        if (thongTinDat.length === 0) {
            throw new Error('Không tìm thấy phiếu đặt trước này.');
        }
        
        const maDauSach = thongTinDat[0].maDauSach;

        // BẢO VỆ LOGIC: Nếu thủ thư muốn chuyển thành DA_CO_SACH, phải đếm xem có Bản sao nào rảnh không
        if (trangThaiMoi === 'DA_CO_SACH') {
            const [banSaoRanh] = await db.query(
                'SELECT COUNT(*) as soLuong FROM BanSaoSach WHERE maDauSach = ? AND trangThai = "CO_SAN"', 
                [maDauSach]
            );
            
            if (banSaoRanh[0].soLuong === 0) {
                // Quăng lỗi ra thẳng mặt nếu kho không có cuốn nào
                throw new Error('Không thể Báo có sách! Hiện tại không có bản sao nào đang rảnh trong kho.');
            }
        }

        // Nếu qua được ải trên (hoặc là bấm HỦY) thì cho phép cập nhật
        const sql = 'UPDATE DatTruoc SET trangThai = ? WHERE id = ?';
        await db.query(sql, [trangThaiMoi, datTruocId]);
        
        return true;
    }
    // DÀNH CHO THỦ THƯ: Lấy danh sách tất cả yêu cầu đặt trước (Kèm số lượng sách rảnh)
    static async getAll() {
        const sql = `
            SELECT dt.id, dt.ngayDat, dt.trangThai, nd.hoTen, ds.tenSach,
                   (SELECT COUNT(*) FROM BanSaoSach bs WHERE bs.maDauSach = dt.maDauSach AND bs.trangThai = 'CO_SAN') AS soLuongCoSan
            FROM DatTruoc dt
            JOIN NguoiDung nd ON dt.nguoiDungId = nd.id
            JOIN DauSach ds ON dt.maDauSach = ds.maDauSach
            ORDER BY dt.ngayDat DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }

    // Lấy lịch sử đặt trước của cá nhân
    static async getLichSuCaNhan(nguoiDungId) {
        const sql = `
            SELECT dt.id, dt.ngayDat, dt.trangThai, ds.tenSach
            FROM DatTruoc dt
            JOIN DauSach ds ON dt.maDauSach = ds.maDauSach
            WHERE dt.nguoiDungId = ?
            ORDER BY dt.ngayDat DESC
        `;
        const [rows] = await db.query(sql, [nguoiDungId]);
        return rows;
    }
}

module.exports = DatTruocModel;
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
    // Cập nhật trạng thái kèm mã vạch (để giữ chỗ)
    // DÀNH CHO THỦ THƯ: Cập nhật trạng thái (Hệ thống TỰ ĐỘNG lấy 1 cuốn để giữ chỗ)
    static async capNhatTrangThai(datTruocId, trangThaiMoi) {
        const [thongTinDat] = await db.query('SELECT maDauSach FROM DatTruoc WHERE id = ?', [datTruocId]);
        if (thongTinDat.length === 0) throw new Error('Không tìm thấy phiếu đặt trước này.');
        
        const maDauSach = thongTinDat[0].maDauSach;
        let maVachDuocChon = null;

        if (trangThaiMoi === 'DA_CO_SACH') {
            // TỰ ĐỘNG: Tìm 1 bản sao đang CÓ SẴN của đầu sách này
            const [banSaoRanh] = await db.query(
                'SELECT maVach FROM BanSaoSach WHERE maDauSach = ? AND trangThai = "CO_SAN" LIMIT 1', 
                [maDauSach]
            );
            
            if (banSaoRanh.length === 0) {
                throw new Error('Không thể Báo có sách! Hiện tại không có bản sao nào đang rảnh trong kho.');
            }

            maVachDuocChon = banSaoRanh[0].maVach;

            // KHÓA SÁCH: Chuyển trạng thái bản sao thành DANG_GIU_CHO
            await db.query('UPDATE BanSaoSach SET trangThai = "DANG_GIU_CHO" WHERE maVach = ?', [maVachDuocChon]);
        }

        const sql = 'UPDATE DatTruoc SET trangThai = ? WHERE id = ?';
        await db.query(sql, [trangThaiMoi, datTruocId]);
        
        // Trả về cái mã vạch vừa được máy chọn để báo lại cho Thủ thư
        return maVachDuocChon; 
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
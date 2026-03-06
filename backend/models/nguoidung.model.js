const db = require('../config/db');

class NguoiDungModel {
    // Tìm người dùng theo email (dùng để check trùng lặp khi đăng ký hoặc lúc đăng nhập)
    static findByEmail(email) {
        return db.query('SELECT * FROM NguoiDung WHERE email = ?', [email]);
    }

    // Tạo người dùng mới
    static create(data) {
        // Mặc định vai trò là 'DOCGIA' như bạn đã set trong file SQL
        const sql = `INSERT INTO NguoiDung (hoTen, email, matKhau, vaiTro) VALUES (?, ?, ?, 'DOCGIA')`;
        return db.query(sql, [data.hoTen, data.email, data.matKhau]);
    }
}

module.exports = NguoiDungModel;
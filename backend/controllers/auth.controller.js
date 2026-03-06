const NguoiDungModel = require('../models/nguoidung.model');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    const { hoTen, email, matKhau } = req.body;

    try {
        // 1. Kiểm tra dữ liệu đầu vào cơ bản
        if (!hoTen || !email || !matKhau) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
        }

        // 2. Kiểm tra email đã tồn tại chưa
        const [existingUsers] = await NguoiDungModel.findByEmail(email);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Email này đã được sử dụng!' }); // 409 Conflict
        }

        // 3. Mã hóa mật khẩu
        // genSalt(10) là độ phức tạp của thuật toán mã hóa (10 là mức an toàn phổ biến và tối ưu tốc độ)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(matKhau, salt);

        // 4. Lưu vào Database
        const newUser = {
            hoTen,
            email,
            matKhau: hashedPassword
        };
        
        await NguoiDungModel.create(newUser);

        res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server khi đăng ký tài khoản' });
    }
};
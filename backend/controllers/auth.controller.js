const NguoiDungModel = require('../models/nguoidung.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

exports.login = async (req, res) => {
    const { email, matKhau } = req.body;

    try {
        // 1. Kiểm tra đầu vào
        if (!email || !matKhau) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
        }

        // 2. Tìm user theo email trong Database
        const [users] = await NguoiDungModel.findByEmail(email);
        
        // Nếu không tìm thấy user nào
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const user = users[0];

        // 3. So sánh mật khẩu
        // bcrypt.compare sẽ tự động mã hóa matKhau nhập vào và so sánh với chuỗi hash trong DB
        const isMatch = await bcrypt.compare(matKhau, user.matKhau);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        // 4. Tạo JSON Web Token (JWT)
        // Gói những thông tin cần thiết vào payload (không bao giờ đưa mật khẩu vào đây)
        const payload = {
            id: user.id,
            vaiTro: user.vaiTro
        };

        // Ký token với secret key, cài đặt thời hạn sống (ví dụ: 1 ngày)
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'secret_key_du_phong', 
            { expiresIn: '1d' }
        );

        // 5. Trả về kết quả thành công cho Frontend
        res.status(200).json({
            message: 'Đăng nhập thành công',
            token: token,
            user: {
                id: user.id,
                hoTen: user.hoTen,
                email: user.email,
                vaiTro: user.vaiTro
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
    }
};
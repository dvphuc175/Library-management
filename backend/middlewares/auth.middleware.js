const jwt = require('jsonwebtoken');

// 1. Middleware kiểm tra xem người dùng đã đăng nhập chưa (có Token hợp lệ không)
exports.verifyToken = (req, res, next) => {
    // Lấy token từ header của request
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này!' });
    }

    const token = authHeader.split(' ')[1]; // Cắt lấy phần token sau chữ 'Bearer '

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_du_phong');
        
        // Gắn thông tin giải mã được (id, vaiTro) vào object req để các hàm phía sau sử dụng
        req.user = decoded; 
        next(); // Cho phép đi tiếp vào Controller (hoặc Middleware tiếp theo)
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// 2. Middleware kiểm tra quyền Thủ thư hoặc Admin (dùng cho quản lý sách)
exports.checkThuThuOrAdmin = (req, res, next) => {

    if (req.user && (req.user.vaiTro === 'THUTHU' || req.user.vaiTro === 'ADMIN')) {
        next(); // Đủ quyền, cho đi tiếp
    } else {
        return res.status(403).json({ message: 'Chỉ Thủ thư hoặc Admin mới có quyền thực hiện thao tác này!' });
    }
};

// 3. Middleware kiểm tra quyền Admin (dùng cho quản lý người dùng, phân quyền)
exports.checkAdmin = (req, res, next) => {
    if (req.user && req.user.vaiTro === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ message: 'Yêu cầu quyền Admin!' });
    }
};
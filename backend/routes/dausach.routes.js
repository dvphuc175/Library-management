const express = require('express');
const router = express.Router();
const controller = require('../controllers/dausach.controller');
const { verifyToken, checkThuThuOrAdmin } = require('../middlewares/auth.middleware');

// Khách vãng lai và Độc giả đều có thể xem danh sách sách (Không cần bảo vệ)
router.get('/', controller.getAll);
router.get('/:id', controller.getDetail);

// CHỈ Thủ thư và Admin mới được Thêm/Sửa/Xóa sách (Cần bảo vệ)
// Luồng chạy: Gọi API -> verifyToken -> checkThuThuOrAdmin -> create (Controller)
router.post('/', verifyToken, checkThuThuOrAdmin, controller.create);
router.put('/:id', verifyToken, checkThuThuOrAdmin, controller.update);
router.delete('/:id', verifyToken, checkThuThuOrAdmin, controller.delete);

module.exports = router;
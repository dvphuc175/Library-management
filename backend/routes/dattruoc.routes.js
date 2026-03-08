const express = require('express');
const router = express.Router();
const datTruocController = require('../controllers/dattruoc.controller');
const { verifyToken, checkThuThuOrAdmin } = require('../middlewares/auth.middleware');

// Độc giả tạo yêu cầu đặt trước sách
router.post('/', verifyToken, datTruocController.datTruocSach);

// Thủ thư/Admin cập nhật trạng thái đặt trước (báo có sách hoặc hủy)
router.put('/:id/trangthai', verifyToken, checkThuThuOrAdmin, datTruocController.capNhatDatTruoc);
router.get('/', verifyToken, checkThuThuOrAdmin, datTruocController.getAllDatTruoc);
module.exports = router;
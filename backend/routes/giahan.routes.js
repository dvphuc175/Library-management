const express = require('express');
const router = express.Router();
const giaHanController = require('../controllers/giahan.controller');
const { verifyToken, checkThuThuOrAdmin } = require('../middlewares/auth.middleware');

// Độc giả gửi yêu cầu gia hạn
router.post('/yeucau', verifyToken, giaHanController.yeuCauGiaHan);

// Thủ thư/Admin xử lý yêu cầu gia hạn (duyệt hoặc từ chối)
router.put('/:id/xuly', verifyToken, checkThuThuOrAdmin, giaHanController.xuLyGiaHan);

module.exports = router;
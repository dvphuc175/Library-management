const express = require('express');
const router = express.Router();
const phieuMuonController = require('../controllers/phieumuon.controller');
const { verifyToken, checkThuThuOrAdmin } = require('../middlewares/auth.middleware');

// Thủ thư xem tất cả phiếu mượn
router.get('/', verifyToken, checkThuThuOrAdmin, phieuMuonController.getAllPhieuMuon);

// Chỉ thuthu admin đã đăng nhập mới tạo được phiếu mượn
router.post('/muon', verifyToken, checkThuThuOrAdmin, phieuMuonController.muonSach);

// Route Trả sách (Chỉ Thủ thư / Admin dùng)
router.post('/tra', verifyToken, checkThuThuOrAdmin, phieuMuonController.traSach);
module.exports = router;

// Độc giả tự xem lịch sử mượn của mình
router.get('/lichsu', verifyToken, phieuMuonController.layLichSuCaNhan);
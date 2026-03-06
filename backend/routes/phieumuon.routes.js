const express = require('express');
const router = express.Router();
const phieuMuonController = require('../controllers/phieumuon.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Chỉ user đã đăng nhập mới được mượn sách
router.post('/muon', verifyToken, phieuMuonController.muonSach);

module.exports = router;
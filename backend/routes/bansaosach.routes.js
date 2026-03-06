const express = require('express');
const router = express.Router();
const controller = require('../controllers/bansaosach.controller');
const { verifyToken, checkThuThuOrAdmin } = require('../middlewares/auth.middleware');

router.post('/',verifyToken, checkThuThuOrAdmin, controller.create);
router.put('/:id',verifyToken, checkThuThuOrAdmin, controller.updateStatus);
router.delete('/:id',verifyToken, checkThuThuOrAdmin, controller.delete);

module.exports = router;
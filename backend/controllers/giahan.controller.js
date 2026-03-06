const GiaHanModel = require('../models/giahan.model');

exports.yeuCauGiaHan = async (req, res) => {
    const { phieuMuonId, soNgayGiaHan, lyDo } = req.body;

    try {
        if (!phieuMuonId || !soNgayGiaHan) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã phiếu mượn và số ngày muốn gia hạn.' });
        }

        const giaHanId = await GiaHanModel.taoYeuCau(phieuMuonId, soNgayGiaHan, lyDo);
        res.status(201).json({ 
            message: 'Đã gửi yêu cầu gia hạn thành công. Vui lòng chờ thủ thư duyệt!',
            giaHanId: giaHanId
        });
    } catch (error) {
        if (error.message.includes('không hợp lệ') || error.message.includes('chờ duyệt')) {
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu gia hạn.' });
    }
};

exports.xuLyGiaHan = async (req, res) => {
    const giaHanId = req.params.id;
    const { trangThai } = req.body; // 'DA_DUYET' hoặc 'TU_CHOI'

    try {
        if (!['DA_DUYET', 'TU_CHOI'].includes(trangThai)) {
            return res.status(400).json({ message: 'Trạng thái xử lý không hợp lệ.' });
        }

        await GiaHanModel.xuLyYeuCau(giaHanId, trangThai);
        res.status(200).json({ message: `Đã ${trangThai === 'DA_DUYET' ? 'duyệt' : 'từ chối'} yêu cầu gia hạn.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu gia hạn.' });
    }
};
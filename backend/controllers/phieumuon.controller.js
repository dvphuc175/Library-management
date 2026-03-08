const PhieuMuonModel = require('../models/phieumuon.model');

exports.muonSach = async (req, res) => {
    // Lấy cả maVach và nguoiDungId từ body (do Thủ thư nhập vào form)
    const { maVach, nguoiDungId } = req.body; 

    try {
        if (!maVach || !nguoiDungId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã vạch sách và ID độc giả.' });
        }

        // Gọi hàm Transaction trong Model (Chỉ cần truyền 2 biến, Model sẽ tự tính Ngày mượn/Hạn trả)
        // Lưu ý: Phải truyền đúng thứ tự (maVach, nguoiDungId)
        const ketQua = await PhieuMuonModel.taoPhieuMuon(maVach, nguoiDungId);
        
        res.status(201).json({ 
            message: 'Mượn sách thành công!',
            phieuMuonId: ketQua.phieuMuonId,
            hanTra: ketQua.hanTra
        });

    } catch (error) {
        // Cập nhật câu lệnh bắt lỗi để hứng trọn vẹn "Bức tường lửa" từ Model
        if (
            error.message.includes('Từ chối cho mượn') || 
            error.message.includes('tồn tại') || 
            error.message.includes('không có sẵn')
        ) {
            return res.status(400).json({ message: error.message });
        }
        
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi thực hiện mượn sách.' });
    }
};

exports.traSach = async (req, res) => {
    const { maVach } = req.body;

    try {
        if (!maVach) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã vạch sách cần trả.' });
        }

        const phieuId = await PhieuMuonModel.traSach(maVach);

        res.status(200).json({ 
            message: 'Trả sách thành công!',
            phieuMuonId: phieuId
        });

    } catch (error) {
        if (error.message.includes('Không tìm thấy phiếu mượn')) {
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi thực hiện trả sách.' });
    }
};

exports.layLichSuCaNhan = async (req, res) => {
    try {
        const nguoiDungId = req.user.id; // Lấy từ Token
        const lichSu = await PhieuMuonModel.getLichSuCaNhan(nguoiDungId);
        res.status(200).json(lichSu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch sử mượn.' });
    }
};

exports.getAllPhieuMuon = async (req, res) => {
    try {
        const danhSach = await PhieuMuonModel.getAll();
        res.status(200).json(danhSach);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách phiếu mượn.' });
    }
};
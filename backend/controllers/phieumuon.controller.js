const PhieuMuonModel = require('../models/phieumuon.model');

exports.muonSach = async (req, res) => {
    // Lấy cả maVach và nguoiDungId từ body (do Thủ thư nhập vào form)
    const { maVach, nguoiDungId } = req.body; 

    try {
        if (!maVach || !nguoiDungId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mã vạch sách và ID độc giả.' });
        }

        // Thiết lập ngày mượn là hôm nay
        const ngayMuon = new Date();
        
        // Thiết lập hạn trả là 14 ngày sau
        const hanTra = new Date();
        hanTra.setDate(ngayMuon.getDate() + 14);

        // Gọi hàm Transaction trong Model (Truyền ID độc giả vào)
        const phieuId = await PhieuMuonModel.taoPhieuMuon(nguoiDungId, maVach, ngayMuon, hanTra);
        
        res.status(201).json({ 
            message: 'Mượn sách thành công!',
            phieuMuonId: phieuId,
            ngayMuon: ngayMuon.toISOString().split('T')[0],
            hanTra: hanTra.toISOString().split('T')[0]
        });

    } catch (error) {
        // Lỗi do chúng ta throw trong Model (ví dụ: "Sách này hiện không có sẵn")
        if (error.message.includes('Sách này hiện không có sẵn') || error.message.includes('Không tìm thấy')) {
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
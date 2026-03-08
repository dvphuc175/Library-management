document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
        alert('Vui lòng đăng nhập!');
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userString);
    if (user.vaiTro !== 'DOCGIA') {
        window.location.href = 'dashboard.html';
        return;
    }

    // 2. Load dữ liệu đồng thời cho cả 2 bảng
    loadLichSuDatTruoc(token);
    loadLichSuMuonTra(token);
});

async function loadLichSuDatTruoc(token) {
    try {
        const response = await fetch('http://localhost:3000/api/dattruoc/lichsu', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const tbody = document.getElementById('bangDatTruoc');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Bạn chưa đặt trước cuốn sách nào.</td></tr>';
            return;
        }

        data.forEach(item => {
            const ngayDat = new Date(item.ngayDat).toLocaleDateString('vi-VN');
            
            let badgeClass = 'bg-cho';
            let textGhiChu = '<span style="color:#ffc107; font-weight:bold;">Đang chờ sách về...</span>';

            if (item.trangThai === 'DA_CO_SACH') {
                badgeClass = 'bg-tra'; // Màu xanh lá
                textGhiChu = '<span style="color:green; font-weight:bold;">🎉 Đã có sách! Vui lòng ra quầy nhận.</span>';
            } else if (item.trangThai === 'HUY') {
                badgeClass = 'bg-tre'; // Màu đỏ
                textGhiChu = '<span style="color:gray;">Yêu cầu đã bị hủy</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.tenSach}</strong></td>
                <td>${ngayDat}</td>
                <td><span class="badge ${badgeClass}">${item.trangThai}</span></td>
                <td>${textGhiChu}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Lỗi load đặt trước:', error);
    }
}

async function loadLichSuMuonTra(token) {
    try {
        const response = await fetch('http://localhost:3000/api/phieumuon/lichsu', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const tbody = document.getElementById('bangMuonTra');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Bạn chưa từng mượn cuốn sách nào.</td></tr>';
            return;
        }

        data.forEach(item => {
            const ngayMuon = new Date(item.ngayMuon).toLocaleDateString('vi-VN');
            const hanTra = new Date(item.hanTra).toLocaleDateString('vi-VN');
            const ngayTra = item.ngayTra ? new Date(item.ngayTra).toLocaleDateString('vi-VN') : '-';
            
            let badgeClass = 'bg-muon';
            if (item.trangThai === 'DA_TRA') badgeClass = 'bg-tra';
            if (item.trangThai === 'QUA_HAN') badgeClass = 'bg-tre';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.tenSach}</strong></td>
                <td>${item.maVach}</td>
                <td>${ngayMuon}</td>
                <td style="color:red;">${hanTra}</td>
                <td>${ngayTra}</td>
                <td><span class="badge ${badgeClass}">${item.trangThai}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Lỗi load mượn trả:', error);
    }
}
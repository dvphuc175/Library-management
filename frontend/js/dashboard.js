document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    // 1. Kiểm tra an ninh: Không có token hoặc là Độc giả thì đuổi ra login
    if (!token || !userString) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userString);
    if (user.vaiTro !== 'THUTHU' && user.vaiTro !== 'ADMIN') {
        alert('Bạn không có quyền truy cập trang Quản trị!');
        window.location.href = 'index.html';
        return;
    }

    // Hiển thị tên
    document.getElementById('adminNameDisplay').innerText = `Xin chào, ${user.vaiTro}: ${user.hoTen}`;

    // 2. Chức năng Đăng xuất
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear(); // Xóa sạch token
        window.location.href = 'login.html';
    });
});

// ==========================================
// HÀM XỬ LÝ MƯỢN SÁCH (CỦA THỦ THƯ)
// ==========================================
async function xuLyMuonSach() {
    const maVach = document.getElementById('muon_maVach').value.trim();
    const nguoiDungId = document.getElementById('muon_nguoiDungId').value.trim();
    const token = localStorage.getItem('token');

    if (!maVach || !nguoiDungId) {
        alert('Vui lòng nhập đủ Mã vạch và ID Độc giả!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/phieumuon/muon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ maVach: maVach, nguoiDungId: nguoiDungId })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Thành công! Mã phiếu mượn: ${data.phieuMuonId}. Nhớ nhắc độc giả hạn trả là: ${data.hanTra}`);
            // Xóa form cho sạch
            document.getElementById('muon_maVach').value = '';
            document.getElementById('muon_nguoiDungId').value = '';
            loadDanhSachPhieuMuon();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi API Mượn:', error);
        alert('Không thể kết nối với máy chủ!');
    }
}

// ==========================================
// HÀM XỬ LÝ TRẢ SÁCH (CỦA THỦ THƯ)
// ==========================================
async function xuLyTraSach() {
    const maVach = document.getElementById('tra_maVach').value.trim();
    const token = localStorage.getItem('token');

    if (!maVach) {
        alert('Vui lòng nhập Mã vạch cuốn sách cần trả!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/phieumuon/tra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ maVach: maVach })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Nhận trả sách thành công! Sách đã được cập nhật trạng thái CÓ SẴN vào kho.');
            document.getElementById('tra_maVach').value = '';
            loadDanhSachPhieuMuon();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi API Trả:', error);
        alert('Không thể kết nối với máy chủ!');
    }
}

// ==========================================
// LOGIC CHUYỂN TAB MENU
// ==========================================
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        // Xóa class active ở tất cả menu
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        // Thêm class active cho menu vừa bấm
        this.classList.add('active');

        // Đổi tiêu đề trang
        document.getElementById('pageTitle').innerText = this.innerText;

        // Ẩn tất cả section
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        
        // Hiện section tương ứng với data-target
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // Nếu chuyển sang tab Quản lý sách thì load lại danh sách sách
        if (targetId === 'section-sach') {
            loadDanhSachSachAdmin();
        }
        // THÊM ĐOẠN NÀY: Nếu sang tab Đặt trước thì gọi API lấy danh sách
        if (targetId === 'section-dattruoc') {
            loadDanhSachDatTruoc();
        }
    });
});

// ==========================================
// HÀM QUẢN LÝ SÁCH: LOAD DANH SÁCH
// ==========================================
async function loadDanhSachSachAdmin() {
    try {
        const response = await fetch('http://localhost:3000/api/dausach');
        const books = await response.json();
        const tbody = document.getElementById('bangDanhSachSach');
        tbody.innerHTML = ''; // Xóa dữ liệu cũ

        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.maDauSach}</td>
                <td>${book.tenSach}</td>
                <td>${book.tacGia || ''}</td>
                <td><strong style="color: ${book.tongSoLuong > 0 ? 'green' : 'red'};">${book.tongSoLuong}</strong> cuốn</td>
                <td>
                    <button class="btn-small" style="background-color: #6c757d;" onclick="moModal('${book.maDauSach}', '${book.tenSach.replace(/'/g, "\\'")}')">
                        Quản lý Bản sao
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Lỗi load danh sách sách:', error);
    }
}

// ==========================================
// HÀM QUẢN LÝ SÁCH: THÊM ĐẦU SÁCH MỚI
// ==========================================
document.getElementById('formThemSach').addEventListener('submit', async function(e) {
    e.preventDefault(); // Chống reload trang
    const token = localStorage.getItem('token');

    const newData = {
        maDauSach: document.getElementById('maDauSach').value,
        tenSach: document.getElementById('tenSach').value,
        tacGia: document.getElementById('tacGia').value,
        theLoai: document.getElementById('theLoai').value,
        nhaXuatBan: document.getElementById('nhaXuatBan').value,  
        namXuatBan: document.getElementById('namXuatBan').value,  
        moTa: document.getElementById('moTa').value,               
        hinhAnh: document.getElementById('hinhAnh').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/dausach', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newData)
        });

        if (response.ok) {
            alert('Thêm đầu sách thành công!');
            this.reset(); // Xóa trắng form
            loadDanhSachSachAdmin(); // Tải lại bảng
        } else {
            const err = await response.json();
            alert('Lỗi: ' + err.message);
        }
    } catch (error) {
        console.error('Lỗi khi thêm sách:', error);
    }
});

// ==========================================
// HÀM QUẢN LÝ SÁCH: THÊM BẢN SAO (MÃ VẠCH)
// ==========================================
async function themBanSaoVatLy(maDauSach, tenSach) {
    const maVach = prompt(`Nhập MÃ VẠCH mới cho cuốn sách "${tenSach}":\n(Ví dụ: MV_${maDauSach}_01)`);
    if (!maVach) return; // Nếu user bấm Cancel thì thôi

    const token = localStorage.getItem('token');
    
    // API BanSaoSach yêu cầu data gồm maVach và maDauSach
    try {
        const response = await fetch('http://localhost:3000/api/bansaosach', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ maVach: maVach, maDauSach: maDauSach })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(`Đã nhập kho mã vạch ${maVach} thành công! Số lượng tổng đã tăng lên 1.`);
            loadDanhSachSachAdmin(); // Tải lại bảng để update số lượng
        } else {
            alert('Lỗi: ' + (data.message || data.error));
        }
    } catch (error) {
        console.error('Lỗi khi thêm bản sao:', error);
        alert('Lỗi kết nối máy chủ!');
    }
}

// ==========================================
// QUẢN LÝ BẢN SAO BẰNG MODAL
// ==========================================
let dauSachDangChon = ''; // Biến toàn cục lưu mã sách đang mở

async function moModal(maDauSach, tenSach) {
    dauSachDangChon = maDauSach;
    document.getElementById('modalTitle').innerText = `Quản lý Bản Sao: ${tenSach}`;
    document.getElementById('modalBanSao').style.display = 'flex';
    
    await loadChiTietBanSao(maDauSach);
}

function dongModal() {
    document.getElementById('modalBanSao').style.display = 'none';
    dauSachDangChon = '';
    document.getElementById('inputMaVachMoi').value = '';
    loadDanhSachSachAdmin(); // Load lại bảng chính để cập nhật tổng số lượng
}

async function loadChiTietBanSao(maDauSach) {
    try {
        const response = await fetch(`http://localhost:3000/api/dausach/${maDauSach}`);
        const data = await response.json();
        const tbody = document.getElementById('bangChiTietBanSao');
        tbody.innerHTML = '';

        if (!data.danhSachBanSao || data.danhSachBanSao.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Chưa có bản sao nào trong kho.</td></tr>';
            return;
        }

        data.danhSachBanSao.forEach(bs => {
            let badgeClass = 'bg-cosan';
            if (bs.trangThai === 'DANG_MUON') badgeClass = 'bg-dangmuon';
            if (bs.trangThai === 'HU_HONG' || bs.trangThai === 'MAT') badgeClass = 'bg-huhong';

            // Xử lý Cột Hành Động theo logic của bạn
            let hanhDongHtml = '';
            
            if (bs.trangThai === 'DANG_MUON') {
                // Nếu đang mượn -> Khóa, không cho sửa hay xóa
                hanhDongHtml = `<span style="color: #888; font-size: 13px;">Đang cho mượn (Khóa)</span>`;
            } else {
                // Nếu có sẵn, hư hỏng, hoặc mất -> Cho phép chọn trạng thái mới và lưu
                hanhDongHtml = `
                    <select id="status_${bs.maVach}" style="padding: 4px; border-radius: 3px;">
                        <option value="CO_SAN" ${bs.trangThai === 'CO_SAN' ? 'selected' : ''}>CÓ SẴN</option>
                        <option value="HU_HONG" ${bs.trangThai === 'HU_HONG' ? 'selected' : ''}>HƯ HỎNG</option>
                        <option value="MAT" ${bs.trangThai === 'MAT' ? 'selected' : ''}>MẤT</option>
                    </select>
                    <button class="btn-small" style="background-color: #ffc107; color: black;" onclick="suaTrangThaiBanSao('${bs.maVach}')">Lưu</button>
                    <button class="btn-small" style="background-color: #dc3545;" onclick="xoaBanSao('${bs.maVach}')">Xóa</button>
                `;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${bs.maVach}</strong></td>
                <td><span class="badge ${badgeClass}">${bs.trangThai}</span></td>
                <td>${hanhDongHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Lỗi tải bản sao:', error);
    }
}

async function suaTrangThaiBanSao(maVach) {
    // Lấy trạng thái mới từ ô select tương ứng
    const trangThaiMoi = document.getElementById(`status_${maVach}`).value;
    const token = localStorage.getItem('token');

    try {
        // Gọi API cập nhật trạng thái bản sao (Bạn kiểm tra lại URL bên Backend xem có khớp không nhé, thường là PUT /api/bansaosach/:id)
        const response = await fetch(`http://localhost:3000/api/bansaosach/${maVach}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ trangThai: trangThaiMoi })
        });

        if (response.ok) {
            alert(`Đã cập nhật trạng thái bản sao ${maVach} thành ${trangThaiMoi}!`);
            loadChiTietBanSao(dauSachDangChon); // Load lại bảng con để thấy màu badge thay đổi
        } else {
            const err = await response.json();
            alert('Lỗi: ' + (err.message || err.error));
        }
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error);
        alert('Lỗi kết nối máy chủ!');
    }
}

async function themBanSaoTuModal() {
    const maVachMoi = document.getElementById('inputMaVachMoi').value.trim();
    if (!maVachMoi) {
        alert('Vui lòng nhập mã vạch!');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/bansaosach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ maVach: maVachMoi, maDauSach: dauSachDangChon })
        });

        if (response.ok) {
            document.getElementById('inputMaVachMoi').value = ''; // Xóa ô nhập
            loadChiTietBanSao(dauSachDangChon); // Tải lại bảng con
        } else {
            const err = await response.json();
            alert('Lỗi: ' + (err.message || err.error));
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
}

async function xoaBanSao(maVach) {
    if (!confirm(`Bạn có chắc muốn XÓA bản sao mã ${maVach} khỏi hệ thống không?`)) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/bansaosach/${maVach}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadChiTietBanSao(dauSachDangChon); // Tải lại bảng con
        } else {
            const err = await response.json();
            alert('Lỗi: ' + (err.message || err.error));
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
}

// ==========================================
// QUẢN LÝ ĐẶT TRƯỚC
// ==========================================
async function loadDanhSachDatTruoc() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/dattruoc', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const tbody = document.getElementById('bangDatTruoc');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không có yêu cầu đặt trước nào.</td></tr>';
            return;
        }

        data.forEach(item => {
            const ngayDat = new Date(item.ngayDat).toLocaleString('vi-VN');
            
            let badgeClass = 'bg-cosan'; 
            if (item.trangThai === 'CHO') badgeClass = 'bg-dangmuon'; 
            if (item.trangThai === 'HUY') badgeClass = 'bg-huhong'; 

            // Logic ẩn/hiện nút thần thánh nằm ở đây:
            let hanhDongHtml = '';
            if (item.trangThai === 'CHO') {
                if (item.soLuongCoSan > 0) {
                    // Nếu kho có sách -> Hiện nút màu xanh
                    hanhDongHtml = `
                        <button class="btn-small" style="background-color: #28a745;" onclick="capNhatDatTruoc(${item.id}, 'DA_CO_SACH')">✔ Báo Có Sách</button>
                        <button class="btn-small" style="background-color: #dc3545;" onclick="capNhatDatTruoc(${item.id}, 'HUY')">✖ Hủy</button>
                    `;
                } else {
                    // Nếu kho trống (0 cuốn) -> Ẩn nút xanh, chỉ hiện nút Hủy và dòng chữ cảnh báo
                    hanhDongHtml = `
                        <span style="color: #ff9800; font-size: 12px; margin-right: 10px; font-style: italic;">Đang chờ sách về...</span>
                        <button class="btn-small" style="background-color: #dc3545;" onclick="capNhatDatTruoc(${item.id}, 'HUY')">✖ Hủy</button>
                    `;
                }
            } else {
                hanhDongHtml = `<span style="color: #888; font-size: 13px;">Đã đóng</span>`;
            }

            // Định dạng hiển thị số lượng (Xanh nếu có, Đỏ nếu không)
            const mauSoLuong = item.soLuongCoSan > 0 ? 'green' : 'red';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td><strong>${item.hoTen}</strong></td>
                <td>${item.tenSach}</td>
                <td style="color: ${mauSoLuong}; font-weight: bold; text-align: center;">${item.soLuongCoSan}</td>
                <td>${ngayDat}</td>
                <td><span class="badge ${badgeClass}">${item.trangThai}</span></td>
                <td>${hanhDongHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Lỗi tải danh sách đặt trước:', error);
    }
}

async function capNhatDatTruoc(id, trangThaiMoi) {
    // Chỉ hỏi xác nhận nhẹ nhàng, không bắt nhập tay nữa
    if (trangThaiMoi === 'HUY') {
        if (!confirm(`Xác nhận HỦY yêu cầu đặt trước mã #${id}?`)) return;
    } else if (trangThaiMoi === 'DA_CO_SACH') {
        if (!confirm(`Xác nhận BÁO CÓ SÁCH cho yêu cầu #${id}?\nHệ thống sẽ tự động khóa 1 cuốn rảnh trong kho.`)) return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/dattruoc/${id}/trangthai`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ trangThai: trangThaiMoi }) // Không cần gửi maVach lên nữa
        });

        const data = await response.json();

        if (response.ok) {
            if (trangThaiMoi === 'DA_CO_SACH') {
                // Đọc mã vạch mà Backend tự gán và báo cho Thủ thư đi tìm
                alert(`THÀNH CÔNG!\nHệ thống đã tự động khóa cuốn sách có mã vạch: [ ${data.maVach} ].\n👉 Thủ thư vui lòng tìm cuốn này cất ra "Kệ Giữ Chỗ" cho độc giả nhé!`);
            } else {
                alert('Đã hủy yêu cầu đặt trước.');
            }
            loadDanhSachDatTruoc(); // Tải lại bảng Đặt trước
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
}

async function loadDanhSachPhieuMuon() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/phieumuon', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const tbody = document.getElementById('bangTatCaPhieuMuon');
        tbody.innerHTML = '';

        data.forEach(item => {
            const ngayMuon = new Date(item.ngayMuon).toLocaleDateString('vi-VN');
            const hanTra = new Date(item.hanTra).toLocaleDateString('vi-VN');
            
            let badgeClass = 'bg-muon';
            if (item.trangThai === 'DA_TRA') badgeClass = 'bg-tra';
            if (item.trangThai === 'QUA_HAN') badgeClass = 'bg-huhong';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td><strong>${item.hoTen}</strong></td>
                <td>${item.tenSach} <br><small style="color:gray;">(${item.maVach})</small></td>
                <td>${ngayMuon}</td>
                <td style="color: ${item.trangThai === 'QUA_HAN' ? 'red' : 'black'};">${hanTra}</td>
                <td><span class="badge ${badgeClass}">${item.trangThai}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Lỗi load danh sách phiếu mượn:', error);
    }
}

// Gọi hàm này ngay khi vào dashboard hoặc chuyển sang tab Mượn/Trả
loadDanhSachPhieuMuon();
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
                    <button class="btn-small" onclick="themBanSaoVatLy('${book.maDauSach}', '${book.tenSach}')">
                        + Nhập Bản Sao (Mã Vạch)
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
        theLoai: document.getElementById('theLoai').value
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
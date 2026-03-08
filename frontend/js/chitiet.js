document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra an ninh cơ bản
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập!');
        window.location.href = 'login.html';
        return;
    }

    // 2. Lấy ID sách từ URL (Ví dụ: chitiet.html?id=IT001 -> lấy ra IT001)
    const urlParams = new URLSearchParams(window.location.search);
    const maDauSach = urlParams.get('id');

    if (!maDauSach) {
        document.getElementById('detailContainer').innerHTML = '<p style="color:red;">Không tìm thấy mã sách!</p>';
        return;
    }

    await loadChiTietSach(maDauSach);
});

async function loadChiTietSach(maDauSach) {
    try {
        const response = await fetch(`http://localhost:3000/api/dausach/${maDauSach}`);
        
        if (!response.ok) {
            document.getElementById('detailContainer').innerHTML = '<p style="color:red;">Sách không tồn tại hoặc đã bị xóa.</p>';
            return;
        }

        const book = await response.json();
        hienThiGiaoDien(book);

    } catch (error) {
        console.error('Lỗi tải chi tiết:', error);
        document.getElementById('detailContainer').innerHTML = '<p style="color:red;">Lỗi kết nối đến máy chủ.</p>';
    }
}

function hienThiGiaoDien(book) {
    const container = document.getElementById('detailContainer');
    const imageUrl = book.hinhAnh ? book.hinhAnh : 'https://via.placeholder.com/300x400?text=No+Image';
    const isAvailable = book.tongSoLuong > 0;
    const btnText = isAvailable ? 'Đặt giữ chỗ ngay' : 'Đặt chờ sách (Hết sách)';
    
    container.innerHTML = `
        <div class="book-cover">
            <img src="${imageUrl}" alt="${book.tenSach}">
        </div>
        <div class="book-info">
            <h2>${book.tenSach}</h2>
            <div class="info-row"><strong>Tác giả:</strong> ${book.tacGia || 'Đang cập nhật'}</div>
            <div class="info-row"><strong>Thể loại:</strong> ${book.theLoai || 'Đang cập nhật'}</div>
            <div class="info-row"><strong>Nhà xuất bản:</strong> ${book.nhaXuatBan || 'Đang cập nhật'}</div>
            <div class="info-row"><strong>Năm xuất bản:</strong> ${book.namXuatBan || 'Đang cập nhật'}</div>
            <div class="info-row"><strong>Số lượng trên kệ:</strong> <span style="color: ${isAvailable ? 'green' : 'red'}; font-weight: bold; font-size: 18px;">${book.tongSoLuong}</span> cuốn</div>
            
            <div class="description">
                <strong>Tóm tắt nội dung:</strong><br>
                ${book.moTa ? book.moTa.replace(/\n/g, '<br>') : '<i>Chưa có thông tin mô tả cho cuốn sách này.</i>'}
            </div>

            <div class="action-box">
                <button class="btn-reserve" onclick="xuLyDatTruoc('${book.maDauSach}')">
                    ${btnText}
                </button>
            </div>
        </div>
    `;
}

// Gọi API Đặt trước (Giống hệt bên index.html)
async function xuLyDatTruoc(maDauSach) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/dattruoc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ maDauSach: maDauSach })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Đặt trước thành công! Vui lòng đến quầy thủ thư để nhận sách hoặc chờ thông báo.');
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối máy chủ!');
    }
}
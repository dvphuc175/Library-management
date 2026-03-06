document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra trạng thái đăng nhập
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (!token || !userString) {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userString);
    
    // Nếu là Admin/Thủ thư thì đuổi về trang Dashboard
    if (user.vaiTro !== 'DOCGIA') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Hiển thị tên người dùng
    document.getElementById('userNameDisplay').innerText = `Xin chào, ${user.hoTen}`;

    // 2. Chức năng Đăng xuất
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // 3. Lấy danh sách sách từ Backend
    await loadBooks();
});

async function loadBooks() {
    try {
        const response = await fetch('http://localhost:3000/api/dausach'); // Cổng 3000
        const books = await response.json();

        const bookListContainer = document.getElementById('bookList');
        bookListContainer.innerHTML = ''; // Xóa nội dung cũ

        if (books.length === 0) {
            bookListContainer.innerHTML = '<p>Thư viện hiện chưa có sách nào.</p>';
            return;
        }

        // Tạo thẻ HTML cho từng cuốn sách
        books.forEach(book => {
            const isAvailable = book.tongSoLuong > 0;
            const btnClass = isAvailable ? 'btn-action' : 'btn-action btn-disabled';
            const btnText = isAvailable ? 'Mượn sách' : 'Đặt trước';
            const imageUrl = book.hinhAnh ? book.hinhAnh : 'https://via.placeholder.com/250x300?text=No+Image';

            const bookCard = `
                <div class="book-card">
                    <img src="${imageUrl}" alt="${book.tenSach}">
                    <h3>${book.tenSach}</h3>
                    <p><strong>Tác giả:</strong> ${book.tacGia || 'Đang cập nhật'}</p>
                    <p><strong>Thể loại:</strong> ${book.theLoai || 'Đang cập nhật'}</p>
                    <p><strong>Số lượng:</strong> ${book.tongSoLuong}</p>
                    <button class="${btnClass}" onclick="handleAction('${book.maDauSach}', ${isAvailable})">
                        ${btnText}
                    </button>
                </div>
            `;
            bookListContainer.innerHTML += bookCard;
        });

    } catch (error) {
        console.error('Lỗi khi tải danh sách sách:', error);
        document.getElementById('bookList').innerHTML = '<p style="color:red;">Không thể tải dữ liệu từ máy chủ.</p>';
    }
}

// 4. Xử lý nút Mượn / Đặt trước (Sẽ code logic gọi API sau)
function handleAction(maDauSach, isAvailable) {
    if (isAvailable) {
        alert(`Sách có mã ${maDauSach} đang có sẵn. Chức năng gọi API mượn sẽ được tích hợp ở bước tiếp theo!`);
    } else {
        alert(`Sách có mã ${maDauSach} đã hết. Chức năng gọi API đặt trước sẽ được tích hợp ở bước tiếp theo!`);
    }
}
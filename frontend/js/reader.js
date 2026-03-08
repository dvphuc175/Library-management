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
            const imageUrl = book.hinhAnh ? book.hinhAnh : 'https://via.placeholder.com/250x300?text=No+Image';
            
            // Nếu còn sách thì ghi "Đặt giữ chỗ", hết thì "Đặt chờ"
            const btnText = isAvailable ? 'Đặt giữ chỗ' : 'Đặt chờ sách';
            const btnColor = isAvailable ? '#007bff' : '#ffc107'; // Xanh blue hoặc Vàng

            // Tạo thẻ HTML cho từng cuốn sách
            const bookCard = `
                <div class="book-card">
                    <!-- Bọc ảnh và tên sách vào link để click -->
                    <a href="chitiet.html?id=${book.maDauSach}" style="text-decoration: none; color: inherit;">
                        <img src="${imageUrl}" alt="${book.tenSach}">
                        <h3 style="color: #007bff;">${book.tenSach}</h3>
                    </a>
                    <p><strong>Tác giả:</strong> ${book.tacGia || 'Đang cập nhật'}</p>
                    <p><strong>Thể loại:</strong> ${book.theLoai || 'Đang cập nhật'}</p>
                    <p><strong>Số lượng trên kệ:</strong> <span style="color: ${isAvailable ? 'green' : 'red'}; font-weight: bold;">${book.tongSoLuong}</span></p>
                    <button class="btn-action" style="background-color: ${btnColor}; color: ${isAvailable ? 'white' : 'black'}; margin-top: 10px;" 
                            onclick="handleAction('${book.maDauSach}')">
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
// 4. Xử lý nút Đặt trước
async function handleAction(maDauSach) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
        window.location.href = 'login.html';
        return;
    }

    try {
        const datTruocRes = await fetch('http://localhost:3000/api/dattruoc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ maDauSach: maDauSach })
        });

        const datTruocData = await datTruocRes.json();
        
        if (datTruocRes.ok) {
            alert('Đặt trước thành công! Vui lòng đến quầy thủ thư để nhận sách hoặc chờ thông báo nếu sách đang hết.');
        } else {
            alert('Lỗi: ' + datTruocData.message);
        }
    } catch (error) {
        console.error('Lỗi khi đặt trước:', error);
        alert('Có lỗi xảy ra khi kết nối đến server.');
    }
}

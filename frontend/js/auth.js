document.getElementById('loginForm').addEventListener('submit', async function(event) {
    // Ngăn chặn form tải lại trang
    event.preventDefault();

    const email = document.getElementById('email').value;
    const matKhau = document.getElementById('matKhau').value;
    const errorMsg = document.getElementById('error-msg');

    try {
        // Gọi API Backend (Nhớ kiểm tra lại Port của Backend có đúng là 3000 không nhé)
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, matKhau: matKhau })
        });

        const data = await response.json();

        if (response.ok) {
            // Đăng nhập thành công: Lưu Token và thông tin User vào localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Điều hướng dựa trên Vai trò (Role)
            if (data.user.vaiTro === 'DOCGIA') {
                window.location.href = 'index.html'; // Độc giả về trang chủ
            } else {
                window.location.href = 'dashboard.html'; // Thủ thư/Admin vào dashboard
            }
        } else {
            // Hiển thị lỗi từ backend (ví dụ: Sai mật khẩu)
            errorMsg.innerText = data.message;
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        errorMsg.innerText = 'Không thể kết nối đến máy chủ!';
        errorMsg.style.display = 'block';
    }
});
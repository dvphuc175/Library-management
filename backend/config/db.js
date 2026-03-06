const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '17052004', // Mật khẩu của bạn
    database: 'forklibrary_db', // Tên database của bạn
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối (Optional - chỉ để bạn yên tâm là kết nối được)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
    } else {
        console.log('Kết nối MySQL thành công!');
        connection.release(); // Trả kết nối về hồ bơi (pool)
    }
});

// QUAN TRỌNG: Phải có .promise() ở đây để dùng được async/await trong Controller
module.exports = pool.promise();
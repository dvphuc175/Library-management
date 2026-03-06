const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
// Import Routes
const dauSachRoutes = require('./routes/dausach.routes');
const banSaoRoutes = require('./routes/bansaosach.routes');
const authRoutes = require('./routes/auth.routes');
const phieuMuonRoutes = require('./routes/phieumuon.routes');
const giaHanRoutes = require('./routes/giahan.routes');
const datTruocRoutes = require('./routes/dattruoc.routes');
const app = express();

app.use(cors());

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/dausach', dauSachRoutes);
app.use('/api/bansaosach', banSaoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/phieumuon', phieuMuonRoutes);
app.use('/api/giahan', giaHanRoutes);
app.use('/api/dattruoc', datTruocRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đã mở cửa và đang lắng nghe tại http://localhost:${PORT}`);
});

module.exports = app;
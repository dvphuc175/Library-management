const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
// Import Routes
const dauSachRoutes = require('./routes/dausach.routes');
const banSaoRoutes = require('./routes/bansaosach.routes');
const authRoutes = require('./routes/auth.routes');
const phieuMuonRoutes = require('./routes/phieumuon.routes');
const giaHanRoutes = require('./routes/giahan.routes');
const datTruocRoutes = require('./routes/dattruoc.routes');
const app = express();


// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/dausach', dauSachRoutes);
app.use('/api/bansaosach', banSaoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/phieumuon', phieuMuonRoutes);
app.use('/api/giahan', giaHanRoutes);
app.use('/api/dattruoc', datTruocRoutes);
module.exports = app;
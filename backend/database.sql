-- =========================
-- TẠO DATABASE
-- =========================
CREATE DATABASE IF NOT EXISTS forklibrary_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE forklibrary_db;
CREATE TABLE NguoiDung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hoTen VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    matKhau VARCHAR(255),
    vaiTro ENUM('DOCGIA', 'THUTHU', 'ADMIN') DEFAULT 'DOCGIA',
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE DauSach (
    maDauSach VARCHAR(20) PRIMARY KEY,
    tenSach VARCHAR(255) NOT NULL,
    tacGia VARCHAR(255),
    theLoai VARCHAR(100),
    nhaXuatBan VARCHAR(255),
    namXuatBan INT,
    moTa TEXT,
    hinhAnh VARCHAR(500) DEFAULT NULL,
    tongSoLuong INT DEFAULT 0
) ENGINE=InnoDB;
CREATE TABLE BanSaoSach (
    maVach VARCHAR(50) PRIMARY KEY,
    maDauSach VARCHAR(20) NOT NULL,
    trangThai ENUM('CO_SAN', 'DANG_MUON', 'HU_HONG', 'MAT', 'DANG_GIU_CHO') DEFAULT 'CO_SAN',

    FOREIGN KEY (maDauSach)
        REFERENCES DauSach(maDauSach)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PhieuMuon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nguoiDungId INT NOT NULL,
    maVach VARCHAR(50) NOT NULL,
    ngayMuon DATE NOT NULL,
    hanTra DATE NOT NULL,
    ngayTra DATE,
    trangThai ENUM('DANG_MUON', 'DA_TRA', 'QUA_HAN') DEFAULT 'DANG_MUON',

    FOREIGN KEY (nguoiDungId)
        REFERENCES NguoiDung(id)
        ON DELETE CASCADE,

    FOREIGN KEY (maVach)
        REFERENCES BanSaoSach(maVach)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE GiaHan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phieuMuonId INT NOT NULL,
    soNgayGiaHan INT NOT NULL,
    lyDo TEXT,
    trangThai ENUM('CHO_DUYET', 'DA_DUYET', 'TU_CHOI') DEFAULT 'CHO_DUYET',
    ngayYeuCau DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (phieuMuonId)
        REFERENCES PhieuMuon(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE DatTruoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nguoiDungId INT NOT NULL,
    maDauSach VARCHAR(20) NOT NULL,
    ngayDat DATETIME DEFAULT CURRENT_TIMESTAMP,
    trangThai ENUM('CHO', 'DA_CO_SACH', 'HUY', 'HOAN_THANH') DEFAULT 'CHO',

    FOREIGN KEY (nguoiDungId)
        REFERENCES NguoiDung(id)
        ON DELETE CASCADE,

    FOREIGN KEY (maDauSach)
        REFERENCES DauSach(maDauSach)
        ON DELETE CASCADE
) ENGINE=InnoDB;

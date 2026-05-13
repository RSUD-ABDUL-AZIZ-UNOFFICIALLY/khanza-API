'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class paket_operasi extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Definisikan relasi di sini jika diperlukan
            // Contoh: paket_operasi.hasMany(models.booking_operasi, { foreignKey: 'kode_paket' });
        }
    }

    paket_operasi.init({
        kode_paket: {
            type: DataTypes.STRING(15),
            allowNull: false,
            primaryKey: true
        },
        nm_perawatan: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        kategori: {
            type: DataTypes.ENUM('Kebidanan', 'Operasi'),
            allowNull: true
        },
        operator1: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        operator2: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        operator3: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        asisten_operator1: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        asisten_operator2: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        asisten_operator3: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        instrumen: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        dokter_anak: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        perawaat_resusitas: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        dokter_anestesi: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        asisten_anestesi: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        asisten_anestesi2: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        bidan: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        bidan2: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        bidan3: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        perawat_luar: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        sewa_ok: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        alat: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        akomodasi: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        bagian_rs: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        omloop: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        omloop2: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        omloop3: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        omloop4: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        omloop5: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        sarpras: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        dokter_pjanak: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        dokter_umum: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        kd_pj: {
            type: DataTypes.CHAR(3),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: true
        },
        kelas: {
            type: DataTypes.ENUM('-', 'Rawat Jalan', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas Utama', 'Kelas VIP', 'Kelas VVIP'),
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'paket_operasi',
        tableName: 'paket_operasi',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });

    return paket_operasi;
};
'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class booking_operasi extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Definisikan relasi di sini jika diperlukan, contoh:
            booking_operasi.belongsTo(models.dokter, { foreignKey: 'kd_dokter' });
            booking_operasi.belongsTo(models.paket_operasi, { foreignKey: 'kode_paket' });
            booking_operasi.belongsTo(models.reg_periksa, { foreignKey: 'no_rawat' });
        }
    }

    booking_operasi.init({
        no_rawat: {
            type: DataTypes.STRING(17),
            allowNull: false,
            primaryKey: true
        },
        kode_paket: {
            type: DataTypes.STRING(15),
            allowNull: false,
            primaryKey: true
        },
        tanggal: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            primaryKey: true
        },
        jam_mulai: {
            type: DataTypes.TIME,
            allowNull: false,
            primaryKey: true
        },
        jam_selesai: {
            type: DataTypes.TIME,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('Menunggu', 'Proses Operasi', 'Selesai'),
            allowNull: true
        },
        kd_dokter: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        kd_ruang_ok: {
            type: DataTypes.STRING(3),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'booking_operasi',
        tableName: 'booking_operasi',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });

    return booking_operasi;
};
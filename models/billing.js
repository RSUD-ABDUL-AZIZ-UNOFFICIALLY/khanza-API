  
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class billing extends Model {
        /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
        static associate(models) {
            billing.belongsTo(models.booking_periksa, {
                as: 'booking_periksa',
                foreignKey: 'no_booking',
            });
        }
    }
    billing.init({
        noindex: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        no_rawat: {
            type: DataTypes.STRING(17),
            allowNull: false
        },
        tgl_byr: {
            type: DataTypes.DATE,
            allowNull: false
        },
        no: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        nm_perawatan: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        pemisah: {
            type: DataTypes.CHAR(1),
            allowNull: false
        },
        biaya: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        jumlah: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        tambahan: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        totalbiaya: {
            type: DataTypes.DOUBLE,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Laborat', 'Radiologi', 'Operasi', 'Obat', 'Ranap Dokter', 'Ranap Dokter Paramedis', 'Ranap Paramedis', 'Ralan Dokter', 'Ralan Dokter Paramedis', 'Ralan Paramedis', 'Tambahan', 'Potongan', 'Administrasi', 'Kamar', '-', 'Registrasi', 'Harian', 'Service', 'TtlObat', 'TtlRanap Dokter', 'TtlRanap Paramedis', 'TtlRalan Dokter', 'TtlRalan Paramedis', 'TtlKamar', 'Dokter', 'Perawat', 'TtlTambahan', 'Retur Obat', 'TtlRetur Obat', 'Resep Pulang', 'TtlResep Pulang', 'TtlPotongan', 'TtlLaborat', 'TtlOperasi', 'TtlRadiologi', 'Tagihan'),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'billing',
        tableName: 'billing',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });
    return billing;
}

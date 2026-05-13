'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class referensi_mobilejkn_bpjs_batal extends Model {

        static associate(models) {

            this.belongsTo(models.dokter, {
                as: 'dokter',
                foreignKey: 'kodedokter',
                sourceKey: 'kodedokter', // Asumsi: Kunci sumber di tabel dokter adalah kodedokter
                allowDirectional: true,
            });
        }
    }

    referensi_mobilejkn_bpjs_batal.init({
        // Primary Key (Jika nobooking adalah primary key)
        no_rkm_medis: {
            type: DataTypes.STRING(15),
            primaryKey: true,
        },
        // Informasi Booking/Rawat
        no_rawat_batal: {
            type: DataTypes.STRING(17),
            allowNull: true,
        },
        nomorreferensi: {
            type: DataTypes.STRING(25),
            allowNull: true,
        },
        keterangan: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        kodepoli: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        nobooking: {
            type: DataTypes.STRING(15),
            allowNull: true,
            unique: true, // Jika ini adalah nomor rekam medis yang unik
        },
        tanggalbatal: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        statuskirim: {
            type: DataTypes.ENUM('Belum', 'Sudah'),
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'referensi_mobilejkn_bpjs_batal',
        tableName: 'referensi_mobilejkn_bpjs_batal',
        timestamps: false, // Karena di skema tidak ada kolom created_at/updated_at
        createdAt: false,
        updatedAt: false,
    });

    return referensi_mobilejkn_bpjs_batal;
};
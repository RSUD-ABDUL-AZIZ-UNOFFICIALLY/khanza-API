'use strict';
const {
    Model
} = require('sequelize');
/**
 * @typedef {import('sequelize')} Sequelize
 * @typedef {import('sequelize').DataTypes} DataTypes
 */

/**
 * Model untuk tabel referensi_mobilejkn_bpjs.
 * Model ini menyimpan data referensi kunjungan pasien yang terintegrasi
 * dengan sistem Mobile JKN dan BPJS.
 * @param {Sequelize} sequelize - Instance Sequelize.
 * @param {DataTypes} DataTypes - Objek DataTypes dari Sequelize.
 * @returns {Model} Model Sequelize.
 */
module.exports = (sequelize, DataTypes) => {
    class ReferensiMobileJknBpjs extends Model {
        /**
         * Metode untuk mendefinisikan asosiasi antar model.
         * Di sini, kita mendasumsikan adanya model seperti 'dokter' atau 'pasien'
         * yang akan dihubungkan melalui foreign key.
         * @param {Object} models - Objek yang berisi semua model yang terdaftar.
         */
        static associate(models) {
            // =====================================================================
            // ASOSIASI
            // =====================================================================

            // 1. Hubungan ke Dokter (Berdasarkan kodedokter)
            // Karena kodedokter ada di sini, ini adalah relasi BelongsTo.
            this.belongsTo(models.dokter, {
                as: 'dokter',
                foreignKey: 'kodedokter',
                sourceKey: 'kodedokter', // Asumsi: Kunci sumber di tabel dokter adalah kodedokter
                allowDirectional: true,
            });

            // 2. Asosiasi dengan Model lain (Contoh: Pasien atau Poli)
            // Jika ada tabel 'pasien', kita bisa menghubungkannya melalui 'nomorkartu' atau 'nik'.
            // this.belongsTo(models.pasien, {
            //   as: 'pasien',
            //   foreignKey: 'nomorkartu',
            //   sourceKey: 'nomorkartu',
            // });

            // Catatan: Asosiasi lain harus disesuaikan berdasarkan model yang benar-benar ada.
        }
    }

    ReferensiMobileJknBpjs.init({
        // Primary Key (Jika nobooking adalah primary key)
        nobooking: {
            type: DataTypes.STRING(15),
            primaryKey: true,
        },

        // Informasi Booking/Rawat
        no_rawat: {
            type: DataTypes.STRING(17),
            allowNull: true,
        },
        nomorkartu: {
            type: DataTypes.STRING(25),
            allowNull: true,
        },
        nik: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        nohp: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        kodepoli: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },

        // Status Pasien
        pasienbaru: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: false,
        },

        // Data Referensi
        norm: {
            type: DataTypes.STRING(15),
            allowNull: true,
            unique: true, // Jika ini adalah nomor rekam medis yang unik
        },
        tanggalperiksa: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        kodedokter: {
            type: DataTypes.STRING(20),
            allowNull: true,
            // Menjadi foreign key ke model dokter
        },
        jampraktek: {
            type: DataTypes.STRING(12),
            allowNull: true,
        },
        jeniskunjungan: {
            // Nilai enum perlu disesuaikan dengan format string di database
            type: DataTypes.ENUM('1 (Rujukan FKTP)', '2 (Rujukan Internal)', '3 (Kontrol)', '4 (Rujukan Antar RS)'),
            allowNull: true,
        },
        nomorreferensi: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        nomorantrean: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        angkaantrean: {
            type: DataTypes.STRING(5),
            allowNull: false,
        },
        estimasidilayani: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },

        // Data Kuota dan Status
        sisakuotajkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        kuotajkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sisakuotanonjkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        kuotanonjkn: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Belum', 'Checkin', 'Batal', 'Gagal'),
            allowNull: false,
        },
        validasi: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        statuskirim: {
            type: DataTypes.ENUM('Belum', 'Sudah'),
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'referensi_mobilejkn_bpjs',
        tableName: 'referensi_mobilejkn_bpjs',
        timestamps: false, // Karena di skema tidak ada kolom created_at/updated_at
        createdAt: false,
        updatedAt: false,
    });

    return ReferensiMobileJknBpjs;
};
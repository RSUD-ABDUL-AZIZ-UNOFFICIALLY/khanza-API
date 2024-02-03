'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class bridging_surat_kontrol_bpjs extends Model {
        static associate(models) {
            // define association here
        }
    }
    bridging_surat_kontrol_bpjs.init({
        no_sep: {
        type: DataTypes.STRING(40),
        primaryKey: true
        },
        tgl_surat: DataTypes.DATEONLY,
        no_surat: DataTypes.STRING(40),
        tgl_rencana: DataTypes.DATEONLY,
        kd_dokter_bpjs: DataTypes.STRING(20),
        nm_dokter_bpjs: DataTypes.STRING(50),
        kd_poli_bpjs: DataTypes.STRING(15),
        nm_poli_bpjs: DataTypes.STRING(40)
    }, {
        sequelize,
        modelName: 'bridging_surat_kontrol_bpjs',
        tableName: 'bridging_surat_kontrol_bpjs',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });

    return bridging_surat_kontrol_bpjs;
};
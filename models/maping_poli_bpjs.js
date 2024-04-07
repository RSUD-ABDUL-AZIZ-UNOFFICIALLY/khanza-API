'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class maping_poli_bpjs extends Model {

        static associate(models) {
            // define association here
            maping_poli_bpjs.hasOne(models.poliklinik, {
                foreignKey: 'kd_poli',
                sourceKey: 'kd_poli_rs',
                as: 'dokter'
            });
        }

    }
    maping_poli_bpjs.init({
        kd_poli_rs: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        kd_poli_bpjs: DataTypes.STRING,
        nm_poli_bpjs: DataTypes.STRING,

    }, {
        sequelize,
        modelName: 'maping_poli_bpjs',
        tableName: 'maping_poli_bpjs',
        timestamps: false,
        createdAt: false,
        updatedAt: false,



    });
    return maping_poli_bpjs;
};
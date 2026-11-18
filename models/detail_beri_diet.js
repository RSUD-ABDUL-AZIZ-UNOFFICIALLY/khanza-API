'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class detail_beri_diet extends Model {
        /**
        * Helper method for defining associations.
        * This method is not a part of Sequelize lifecycle.
        * The `models/index` file will call this method automatically.
        */
        static associate(models) {
            detail_beri_diet.belongsTo(models.diet, {
                as: 'diet',
                foreignKey: 'kd_diet',
            });
            detail_beri_diet.belongsTo(models.reg_periksa, {
                as: 'reg_periksa',
                foreignKey: 'no_rawat',
            });
            detail_beri_diet.belongsTo(models.kamar, {
                as: 'kamar',
                foreignKey: 'kd_kamar',
            });
        }
    }
    detail_beri_diet.init({
        no_rawat: {
            type: DataTypes.STRING(17),
            primaryKey: true,
        },
        kd_kamar: {
            type: DataTypes.STRING(15),
            primaryKey: true,
        },
        tanggal: {
            type: DataTypes.DATEONLY,
            primaryKey: true,
        },
        waktu: {
            type: DataTypes.ENUM('Pagi', 'Pagi2', 'Pagi3', 'Siang', 'Siang2', 'Siang3', 'Sore', 'Sore2', 'Sore3', 'Malam', 'Malam2', 'Malam3'),
            primaryKey: true,
        },
        kd_diet: {
            type: DataTypes.STRING(3),
            primaryKey: true,
        },
    }, {
        sequelize,
        modelName: 'detail_beri_diet',
        tableName: 'detail_beri_diet',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });
    return detail_beri_diet;
};

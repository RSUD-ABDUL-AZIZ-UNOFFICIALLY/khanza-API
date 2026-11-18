'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class diet extends Model {
        /**
        * Helper method for defining associations.
        * This method is not a part of Sequelize lifecycle.
        * The `models/index` file will call this method automatically.
        */
        static associate(models) {
            diet.hasMany(models.detail_beri_diet, {
                as: 'detail_beri_diet',
                foreignKey: 'kd_diet',
            });
        }
    }
    diet.init({
        kd_diet: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        nama_diet: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'diet',
        tableName: 'diet',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    });
    return diet;
};

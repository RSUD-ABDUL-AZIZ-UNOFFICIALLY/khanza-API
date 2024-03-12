'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class rujukan_internal_poli extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      rujukan_internal_poli.hasOne(models.poliklinik, {
        foreignKey: 'kd_poli',
        sourceKey: 'kd_poli',
        as: 'poliklinik'
      });
      rujukan_internal_poli.hasOne(models.dokter, {
        foreignKey: 'kd_dokter',
        sourceKey: 'kd_dokter',
        as: 'dokter'
      });
    }

  }
  rujukan_internal_poli.init({
    no_rawat: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    kd_dokter: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    kd_poli: {
      type: DataTypes.STRING,
      primaryKey: true,
    },

  }, {
    sequelize,
    modelName: 'rujukan_internal_poli',
    tableName: 'rujukan_internal_poli',
    timestamps: false,
    createdAt: false,
    updatedAt: false,



  });
  return rujukan_internal_poli;
};
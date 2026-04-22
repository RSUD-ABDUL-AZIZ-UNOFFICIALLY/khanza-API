'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class berkas_digital_perawatan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      berkas_digital_perawatan.hasOne(models.master_berkas_digital, {
        foreignKey: 'kode',
        sourceKey: 'kode',
        as: 'master_berkas_digital'
        
      })
    }

  }
  berkas_digital_perawatan.init({
    no_rawat: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    kode: DataTypes.STRING,
    lokasi_file: DataTypes.STRING,

    // createdAt: { type: DataTypes.DATE, field: 'created_at' },
    // updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    // If don't want createdAt
  }, {
    sequelize,
    modelName: 'berkas_digital_perawatan',
    tableName: 'berkas_digital_perawatan',
    timestamps: false,
    createdAt: false,
    updatedAt: false,



  });
  return berkas_digital_perawatan;
};
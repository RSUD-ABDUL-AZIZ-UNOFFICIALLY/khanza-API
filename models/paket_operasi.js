'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class paket_operasi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

  }
  paket_operasi.init({
    kode_paket: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    nm_perawatan: DataTypes.STRING,
    kategori: DataTypes.ENUM('Kebidanan', 'Operasi'),
    instrumen: DataTypes.DOUBLE,
    sarpras: DataTypes.DOUBLE,

  }, {
    sequelize,
    modelName: 'paket_operasi',
    tableName: 'paket_operasi',
    timestamps: false,
    createdAt: false,
    updatedAt: false,



  });
  return paket_operasi;
};
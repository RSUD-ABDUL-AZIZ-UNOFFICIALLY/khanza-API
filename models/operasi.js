'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class operasi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      operasi.belongsTo(models.dokter, {
        foreignKey: 'dokter_anestesi',
        sourceKey: 'kd_dokter',
        as: 'dr_anestesi',
      });
      operasi.belongsTo(models.dokter, {
        foreignKey: 'operator1',
        sourceKey: 'kd_dokter',
        as: 'dr_operator1'
      });
      operasi.belongsTo(models.paket_operasi, {
        foreignKey: 'kode_paket',
        sourceKey: 'kode_paket',
        as: 'paket_operasi'
      });
    }

  }
  operasi.init({
    no_rawat: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    tgl_operasi: DataTypes.DATE,
    jenis_anasthesi: DataTypes.STRING,
    kategori: DataTypes.ENUM('-', 'Khusus', 'Besar', 'Sedang', 'Kecil', 'Elektive', 'Emergency'),
    operator1: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    operator2: DataTypes.STRING,
    operator3: DataTypes.STRING,
    asisten_operator1: DataTypes.STRING,
    asisten_operator2: DataTypes.STRING,
    asisten_operator3: DataTypes.STRING,
    instrumen: DataTypes.STRING,
    dokter_anak: DataTypes.STRING,
    dokter_anestesi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    asisten_anastesi: DataTypes.STRING,
    asisten_anastesi2: DataTypes.STRING,
    bidan: DataTypes.STRING,
    bidan2: DataTypes.STRING,
    bidan3: DataTypes.STRING,
    kode_paket: DataTypes.STRING,
    biayainstrumen: DataTypes.DOUBLE,
    biayasarpras: DataTypes.DOUBLE,


  }, {
    sequelize,
    modelName: 'operasi',
    tableName: 'operasi',
    timestamps: false,
    createdAt: false,
    updatedAt: false,



  });
  return operasi;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class master_berkas_digital extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

  }
  master_berkas_digital.init({
    kode: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    nama: DataTypes.STRING

    // createdAt: { type: DataTypes.DATE, field: 'created_at' },
    // updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    // If don't want createdAt
  }, {
    sequelize,
    modelName: 'master_berkas_digital',
    tableName: 'master_berkas_digital',
    timestamps: false,
    createdAt: false,
    updatedAt: false,



  });
  return master_berkas_digital;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class dpjp_ranap extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      dpjp_ranap.hasOne(models.dokter, {
        foreignKey: 'kd_dokter',
        sourceKey: 'kd_dokter',
        as: 'dokter'

      })
    }

  }
  dpjp_ranap.init({
    no_rawat: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    kd_dokter: DataTypes.STRING,
    no: DataTypes.STRING,

    // createdAt: { type: DataTypes.DATE, field: 'created_at' },
    // updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
    // If don't want createdAt
  }, {
    sequelize,
    modelName: 'dpjp_ranap',
    tableName: 'dpjp_ranap',
    timestamps: false,
    createdAt: false,
    updatedAt: false,



  });
  return dpjp_ranap;
};
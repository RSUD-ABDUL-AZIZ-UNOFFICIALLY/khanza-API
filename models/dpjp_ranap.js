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
      dpjp_ranap.belongsTo(models.dokter, {
        as: 'dokter',
        foreignKey: 'kd_dokter',
      });

    }

  }
  dpjp_ranap.init({
    no_rawat: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    kd_dokter: DataTypes.STRING,

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
'use strict';
const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class resep_obat extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            resep_obat.belongsTo(models.reg_periksa, {
                foreignKey: 'no_rawat',
                targetKey: 'no_rawat',
                as: 'reg_periksa',
            });

            resep_obat.belongsTo(models.dokter, {
                foreignKey: 'kd_dokter',
                targetKey: 'kd_dokter',
                as: 'dokter',
            });

        }
    }

    resep_obat.init({
        no_resep: {
            type: DataTypes.STRING(14),
            primaryKey: true,
            allowNull: false,
            defaultValue: ''
        },
        tgl_perawatan: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        jam: {
            type: DataTypes.TIME,
            allowNull: false
        },
        no_rawat: {
            type: DataTypes.STRING(17),
            allowNull: false,
            defaultValue: '',
            references: {
                model: 'reg_periksa',
                key: 'no_rawat'
            }
        },
        kd_dokter: {
            type: DataTypes.STRING(20),
            allowNull: false,
            references: {
                model: 'dokter',
                key: 'kd_dokter'
            }
        },
        tgl_peresepan: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        jam_peresepan: {
            type: DataTypes.TIME,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        tgl_penyerahan: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        jam_penyerahan: {
            type: DataTypes.TIME,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'resep_obat',
        tableName: 'resep_obat',
        timestamps: false,
        createdAt: false,
        updatedAt: false,
        indexes: [
            {
                name: 'PRIMARY',
                unique: true,
                fields: [{ name: 'no_resep' }]
            },
            {
                name: 'no_rawat',
                fields: [{ name: 'no_rawat' }]
            },
            {
                name: 'kd_dokter',
                fields: [{ name: 'kd_dokter' }]
            },
            {
                name: 'idx_resep_peresepan',
                fields: [{ name: 'tgl_peresepan' }, { name: 'jam_peresepan' }]
            }
        ]
    });

    return resep_obat;
};
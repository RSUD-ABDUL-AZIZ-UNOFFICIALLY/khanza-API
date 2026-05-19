'use strict';
const { icd10,icd9,penyakit,kategori_penyakit, reg_periksa, diagnosa_pasien } = require('../models');
const { Op, sequelize } = require("sequelize");
module.exports = {
geticd10: async (req, res) => {
    try{
        const param = req.query;
        if (!param.limit) {
            param.limit = 10;
        }
        if (param.limit > 100) {
            param.limit = 100;
        }
        // if (!param.search) {
        //     return res.status(422).json({
        //         status: false,
        //         message: 'Search is required in params',
        //         data: null
        //     });

        // }
        const data = await icd10.findAll({
            where: {
                [Op.or]: [
                    { kd_penyakit: { [Op.like]: `%${param.search}%` } },
                    { nm_penyakit: { [Op.like]: `%${param.search}%` } },
                    { ciri_ciri: { [Op.like]: `%${param.search}%` } }
                ]
            },
            //toINT: parseInt(param.limit),
            limit: parseInt(param.limit), 
        });
      
        return res.status(200).json({
            status: true,
            message: 'Data icd10',
            record: data.length,
            data: data
        }
        );
    } catch (err) {
        return res.status(400).json({
            status: false,
            message: 'Bad Request',
            data: err
        });
    }

    },
    getdetailICD10: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await icd10.findOne({
                where: {
                    kd_penyakit: id
                }
            });
            if (!data) {
                return res.status(404).json({
                    status: false,
                    message: 'Data not founds',
                    data: null
                });
            }
            return res.status(200).json({
                status: true,
                message: 'Data icd10',
                data: data
            }
            );
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
  },
  geticd9: async (req, res) => {
    try{
        const param = req.query;
        if (!param.limit) {
            param.limit = 10;
        }
        if (param.limit > 100) {
            param.limit = 100;
        }
        const data = await icd9.findAll({
            where: {
                [Op.or]: [
                    { kode: { [Op.like]: `%${param.search}%` } },
                    { deskripsi_pendek: { [Op.like]: `%${param.search}%` } },
                    { deskripsi_panjang: { [Op.like]: `%${param.search}%` } }
                ]
            },
            //toINT: parseInt(param.limit),
            limit: parseInt(param.limit), 
        });
      
        return res.status(200).json({
            status: true,
            message: 'Data icd9',
            record: data.length,
            data: data
        }
        );
    } catch (err) {
        return res.status(400).json({
            status: false,
            message: 'Bad Request',
            data: err
        });
    }
    },
    getdetailICD9: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await icd9.findOne({
                where: {
                    kode: id
                }
            });
            if (!data) {
                return res.status(404).json({
                    status: false,
                    message: 'Data not found',
                    data: null
                });
            }
            return res.status(200).json({
                status: true,
                message: 'Data icd9',
                data: data
            }
            );
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    getRecapICD10: async (req, res) => {
        try {
          const {from, until, status_rawat} = req.query;
          console.log(from, until);
        let data = await reg_periksa.findAll({
            where: {
                tgl_registrasi: {
                    [Op.between]: [from, until]
                },
                status_lanjut: status_rawat
            },
            attributes: ['no_rawat','tgl_registrasi', 'no_rkm_medis'],
            include: [
                {
                    model: diagnosa_pasien,
                    as: 'diagnosa_pasien',
                    attributes: ['kd_penyakit', 'status', 'prioritas', 'status_penyakit'],
                    order: [
                        ['prioritas', 'DESC']
                    ],
                    limit: 3,
                    include: [
                        {
                            model: penyakit,
                            as: 'penyakit',
                            attributes: ['nm_penyakit', 'ciri_ciri', 'status']
                        }
                    ]
                }
            ]
        });

            return res.status(200).json({
                status: true,
                message: 'Data icd10',
                data: data
            }
            );
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    getRecapICD9: async (req, res) => {
        try {
            const { from, until, limit } = req.query;

            // Validate required parameters
            if (!from || !until) {
                return res.status(422).json({
                    status: false,
                    message: 'Parameters "from" and "until" are required (format: YYYY-MM-DD)',
                    data: null
                });
            }

            // Set default and max limit
            let resultLimit = limit ? parseInt(limit) : 10;
            if (resultLimit > 100) {
                resultLimit = 100;
            }

            // Get patient records within date range
            const patientRecords = await reg_periksa.findAll({
                where: {
                    tgl_registrasi: {
                        [Op.between]: [from, until]
                    }
                },
                attributes: ['no_rawat'],
                raw: true
            });

            // Extract no_rawat from results
            const recordIds = patientRecords.map(record => record.no_rawat);

            if (recordIds.length === 0) {
                return res.status(200).json({
                    status: true,
                    message: 'No patient records found within date range',
                    record: 0,
                    data: []
                });
            }

            // Get all diagnoses (ICD-9 codes) for these records
            const diagnoses = await diagnosa_pasien.findAll({
                where: {
                    no_rawat: {
                        [Op.in]: recordIds
                    },
                    status: 'Ralan'  // Only outpatient diagnoses (ICD-9)
                },
                attributes: ['kd_penyakit', [sequelize.fn('COUNT', sequelize.col('kd_penyakit')), 'count']],
                group: ['kd_penyakit'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: resultLimit,
                raw: true,
                subQuery: false
            });

            // Get ICD-9 details for each code
            const icd9Details = await Promise.all(
                diagnoses.map(async (diagnosis) => {
                    const icd9Detail = await icd9.findOne({
                        where: {
                            kode: diagnosis.kd_penyakit
                        },
                        attributes: ['kode', 'deskripsi_pendek', 'deskripsi_panjang'],
                        raw: true
                    });

                    return {
                        kode: diagnosis.kd_penyakit,
                        deskripsi_pendek: icd9Detail?.deskripsi_pendek || '-',
                        deskripsi_panjang: icd9Detail?.deskripsi_panjang || '-',
                        total_penggunaan: diagnosis.count
                    };
                })
            );

            return res.status(200).json({
                status: true,
                message: 'Most used ICD-9 codes within date range',
                record: icd9Details.length,
                date_range: {
                    from: from,
                    until: until
                },
                data: icd9Details
            });

        } catch (err) {
            console.error('Error in getRecapICD9:', err);
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: err.message
            });
        }
    }
};

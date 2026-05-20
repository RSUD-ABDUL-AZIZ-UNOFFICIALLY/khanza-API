'use strict';
const { icd10, icd9, penyakit, kategori_penyakit, reg_periksa, diagnosa_pasien, prosedur_pasien, sequelize } = require('../models');
const { Op } = require("sequelize");
module.exports = {
    geticd10: async (req, res) => {
        try {
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
        try {
            console.log(req.query);
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
            const { from, until, status_rawat, limit } = req.query;

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
                    },
                    ...(status_rawat && { status_lanjut: status_rawat })
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
                    date_range: {
                        from: from,
                        until: until
                    },
                    data: []
                });
            }

            // Get all diagnoses (ICD-10 codes) for these records, grouped and counted
            const diagnoses = await diagnosa_pasien.findAll({
                where: {
                    no_rawat: {
                        [Op.in]: recordIds
                    },
                    status: status_rawat
                },
                attributes: ['kd_penyakit', [sequelize.fn('COUNT', sequelize.col('kd_penyakit')), 'count']],
                group: ['kd_penyakit'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: resultLimit,
                raw: true,
                subQuery: false
            });

            // Get ICD-10 details for each code
            const icd10Details = await Promise.all(
                diagnoses.map(async (diagnosis) => {
                    const icd10Detail = await icd10.findOne({
                        where: {
                            kd_penyakit: diagnosis.kd_penyakit
                        },
                        attributes: ['kd_penyakit', 'nm_penyakit', 'ciri_ciri'],
                        raw: true
                    });

                    return {
                        kd_penyakit: diagnosis.kd_penyakit,
                        nm_penyakit: icd10Detail?.nm_penyakit || '-',
                        ciri_ciri: icd10Detail?.ciri_ciri || '-',
                        total_penggunaan: diagnosis.count
                    };
                })
            );

            return res.status(200).json({
                status: true,
                message: 'Most used ICD-10 codes within date range',
                record: icd10Details.length,
                date_range: {
                    from: from,
                    until: until
                },
                data: icd10Details
            });

        } catch (err) {
            console.error('Error in getRecapICD10:', err);
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: err.message
            });
        }
    },
    getRecapICD9: async (req, res) => {
        try {
            const { from, until, status_rawat, limit } = req.query;

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
            const tindakan_pasein = await prosedur_pasien.findAll({
                where: {
                    no_rawat: {
                        [Op.in]: recordIds
                    },
                    status: status_rawat  // Only outpatient tindakan_pasein (ICD-9)
                },
                attributes: ['kode', [sequelize.fn('COUNT', sequelize.col('kode')), 'count']],
                group: ['kode'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: resultLimit,
                raw: true,
                subQuery: false
            });
            console.log(tindakan_pasein);
            // Get ICD-9 details for each code
            const icd9Details = await Promise.all(
                tindakan_pasein.map(async (prosedur) => {
                    console.log(prosedur);
                    const icd9Detail = await icd9.findOne({
                        where: {
                            kode: prosedur.kode
                        },
                        attributes: ['kode', 'deskripsi_pendek', 'deskripsi_panjang'],
                        raw: true
                    });

                    return {
                        kode: prosedur.kd_penyakit,
                        icd9Detail,
                        // deskripsi_pendek: icd9Detail?.deskripsi_pendek || '-',
                        // deskripsi_panjang: icd9Detail?.deskripsi_panjang || '-',
                        total_penggunaan: prosedur.count
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

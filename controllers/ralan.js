'use strict';
const { reg_periksa, pasien, dokter, poliklinik, jadwal, pegawai, pemeriksaan_ralan, master_berkas_digital, berkas_digital_perawatan, bridging_sep, rujukan_internal_poli, resep_obat } = require('../models');
const { Op, where } = require("sequelize");
module.exports = {
    getIGD: async (req, res) => {
        try {
            const param = req.query;
            let dataIGD = await reg_periksa.findAll({
                attributes: ['no_rawat', 'tgl_registrasi', 'jam_reg', 'kd_dokter'],
                where: {
                    kd_poli: 'IGDK',
                    status_lanjut: 'Ralan',
                    tgl_registrasi: { [Op.between]: [param.from, param.until] },
                },
                include: [{
                    model: pasien,
                    as: 'pasien',
                    attributes: ['no_rkm_medis', 'nm_pasien', 'jk', 'tgl_lahir']
                },
                {
                    model: dokter,
                    as: 'dokter',
                    attributes: ['nm_dokter']
                }],
            });
            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: dataIGD.length,
                data: dataIGD,
                queryParam: param,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }

    },
    getPoli: async (req, res) => {
        try {
            let dataPoliklinik = await poliklinik.findAll({
                where: {
                    status: '1'
                },
                attributes: ['kd_poli', 'nm_poli'],
            });
            return res.status(200).json({
                status: true,
                message: 'Data poliklinik',
                record: dataPoliklinik.length,
                data: dataPoliklinik,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });

        }
    },
    getPoliByKdPoli: async (req, res) => {
        try {
            let kd_dokter = req.query.kd_dokter || '%';
            if (kd_dokter === '-') {
                kd_dokter = '%';
            }
            let px = req.query.px || '%';

            let dataPoliklinik = await reg_periksa.findAll({
                attributes: ['no_rawat', 'tgl_registrasi', 'jam_reg', 'kd_dokter'],
                where: {
                    kd_poli: req.params.kd_poli,
                    status_lanjut: 'Ralan',
                    tgl_registrasi: { [Op.between]: [req.query.from, req.query.until] },
                },
                include: [{
                    model: pasien,
                    as: 'pasien',
                    where: {
                        [Op.or]: [{ no_rkm_medis: { [Op.startsWith]: px } }, { nm_pasien: { [Op.startsWith]: px } }]
                    },
                    attributes: ['no_rkm_medis', 'nm_pasien', 'jk', 'tgl_lahir']
                },
                    {
                        model: bridging_sep,
                        as: 'bridging_sep',
                        attributes: ['no_sep'],
                        required: false
                    },
                    {
                    model: dokter,
                    as: 'dokter',
                    attributes: ['kd_dokter', 'nm_dokter'],
                        where: { kd_dokter: { [Op.like]: kd_dokter } }
                    }
                ],
                order: [
                    ['no_rawat', 'DESC']
                ]
            });
            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: dataPoliklinik.length,
                data: dataPoliklinik,
            });
            
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
            
        }
    },
    getJadwalPoli: async (req, res) => {
        try {
            let query = req.query;
            let dataJadwal = await jadwal.findAll({
                attributes: ['kd_dokter', 'hari_kerja', 'jam_mulai', 'jam_selesai', 'kd_poli', 'kuota'],
                where: {
                    kd_poli: query.kd_poli,
                },
                include: [{
                    model: dokter,
                    as: 'dokter',
                    attributes: ['nm_dokter']
                }],
            });
            // group by hari_kerja
            let dataJadwalGroup = [];
            dataJadwal.forEach((item) => {
                let index = dataJadwalGroup.findIndex((x) => x.hari_kerja === item.hari_kerja);
                if (index === -1) {
                    dataJadwalGroup.push({
                        hari_kerja: item.hari_kerja,
                        data: [item],
                    });
                } else {
                    dataJadwalGroup[index].data.push(item);
                }
            });

            return res.status(200).json({
                status: true,
                message: 'Data jadwal',
                record: dataJadwal.length,
                data: dataJadwalGroup,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    getJadwaldrPoli: async (req, res) => {
        try {
            let query = req.query;
            let dataJadwal = await jadwal.findAll({
                attributes: ['kd_dokter', 'hari_kerja', 'jam_mulai', 'jam_selesai', 'kd_poli', 'kuota'],
                where: {
                    kd_poli: query.kd_poli,
                },
                include: [{
                    model: dokter,
                    as: 'dokter',
                    attributes: ['nm_dokter', 'no_ijn_praktek']
                },
                {
                    model: pegawai,
                    as: 'pegawai',
                    attributes: ['no_ktp']
                }
            ],
                order: [
                    ['kd_dokter', 'ASC'],
                ],
            });
            const groupedData = {};

            dataJadwal.forEach(item => {
                const kdDokter = item.kd_dokter;
                const namaDokter = item.dokter.nm_dokter;
                const hariKerja = item.hari_kerja;
                const jamMulai = item.jam_mulai;
                const jamSelesai = item.jam_selesai;

                if (!groupedData[namaDokter]) {
                    groupedData[namaDokter] = {
                        kd_dokter: kdDokter,
                        nm_dokter: namaDokter,
                        no_ijn_praktek: "SIP: "+  item.dokter.no_ijn_praktek,
                        no_ktp: item.pegawai.no_ktp,
                        jadwal: []
                    };
                }

                groupedData[namaDokter].jadwal.push({
                    hari_kerja: hariKerja,
                    jam_mulai: jamMulai,
                    jam_selesai: jamSelesai
                });
            });

            const groupedDataArray = Object.values(groupedData);
            return res.status(200).json({
                status: true,
                message: 'Data jadwal',
                record: groupedDataArray.length,
                data: groupedDataArray,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    getDrPoli: async (req, res) => {
        try {
            let dataJadwal = await jadwal.findAll({
                attributes: ['kd_dokter', 'kd_poli'],
                include: [{
                    model: dokter,
                    as: 'dokter',
                    attributes: ['nm_dokter', 'kd_dokter']
                }, {

                    model: poliklinik,
                    as: 'poliklinik',
                    attributes: ['nm_poli']
                }],
                group: ['kd_dokter', 'kd_poli'],
                order: [
                    ['kd_poli', 'ASC'],
                    ['kd_dokter', 'ASC'],
                ],
            });
            const groupedData = {};
            dataJadwal.forEach(item => {
                const kdPoli = item.kd_poli;
                const namaDokter = item.dokter.nm_dokter;

                if (!groupedData[kdPoli]) {
                    groupedData[kdPoli] = {
                        poliklinik: item.poliklinik.nm_poli,
                        kd_poli: kdPoli,
                        dokter: [namaDokter]
                    };
                } else {
                    groupedData[kdPoli].dokter.push(namaDokter);
                }
            });
            const groupedDataArray = Object.values(groupedData);

            // group by kd_poli list dokter
            return res.status(200).json({
                status: true,
                message: 'Data jadwal',
                record: groupedDataArray.length,
                data: groupedDataArray,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    getAntiranPoli: async (req, res) => {
        try {
            let query = req.query;
            console.log(query);
            if (!query.tgl_antrean || !query.kd_poli) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    data: 'Parameter tgl_antrean dan kd_poli harus diisi'
                });
            }
            let dataAntiran = await reg_periksa.findAll({
                attributes: ['no_reg', 'no_rawat', 'tgl_registrasi', 'kd_poli', 'status_lanjut','stts'],
                where: {
                    tgl_registrasi: query.tgl_antrean,
                    kd_poli: query.kd_poli,
                    status_lanjut: 'Ralan'
                },
                include: [
                    {
                    model: pasien,
                    as: 'pasien',
                    attributes: ['nm_pasien', 'no_rkm_medis', 'no_ktp','no_peserta']
                },
                    {
                        model: poliklinik,
                        as: 'poliklinik',
                        attributes: ['nm_poli']
                    },
                    {
                    model: dokter,
                    as: 'dokter',
                    attributes: ['nm_dokter']
                }
            ],
                order: [
                    ['no_reg', 'ASC'],
                ],
            });
            return res.status(200).json({
                status: true,
                message: 'Data antrean',
                record: dataAntiran.length,
                data: dataAntiran,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    getAntiranRujukanPoli: async (req, res) => {
        let query = req.query;
        console.log(query);
        if (!query.tgl_antrean || !query.kd_poli) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: 'Parameter tgl_antrean dan kd_poli harus diisi'
            });
        }
        try {

            let data_rujukan_internal_poli = await rujukan_internal_poli.findAll({
                where: {
                    kd_poli: query.kd_poli,
                },
                raw: true,
                nest: true,
                include: [
                    {
                        model: reg_periksa,
                        as: 'reg_periksa',
                        where: {
                            tgl_registrasi: query.tgl_antrean,
                            status_lanjut: 'Ralan'
                        },
                        attributes: ['no_reg', 'no_rawat', 'tgl_registrasi', 'kd_poli', 'status_lanjut', 'stts'],
                        include: [
                            {
                                model: pasien,
                                as: 'pasien',
                                attributes: ['nm_pasien', 'no_rkm_medis', 'no_ktp', 'no_peserta']
                            }
                        ]
                    },
                    {
                        model: poliklinik,
                        as: 'poliklinik',
                        attributes: ['nm_poli']
                    },
                    {
                        model: dokter,
                        as: 'dokter',
                        attributes: ['nm_dokter']
                    }
                ]
            })

            //  {
            // "no_reg": "001",
            // "no_rawat": "2026/07/04/000029",
            // "tgl_registrasi": "2026-07-04",
            // "kd_poli": "INT",
            // "status_lanjut": "Ralan",
            // "stts": "Batal",
            // "pasien": {
            //     "nm_pasien": "RINDAR PRIHARTONO",
            //     "no_rkm_medis": "022860",
            //     "no_ktp": "6172020701680001",
            //     "no_peserta": "0000051156257"
            // },
            // "poliklinik": {
            //     "nm_poli": "Poliklinik Penyakit Dalam"
            // },
            // "dokter": {
            //     "nm_dokter": "dr. Rahmad Budianto, Sp.PD"
            // }
            // },


            //      {
            //     "no_rawat": "2026/07/04/000078",
            //     "kd_dokter": "D22",
            //     "kd_poli": "INT",
            //     "reg_periksa": {
            //         "no_reg": "003",
            //         "no_rawat": "2026/07/04/000078",
            //         "tgl_registrasi": "2026-07-04",
            //         "kd_poli": "U0004",
            //         "status_lanjut": "Ralan",
            //         "stts": "Sudah",
            //         "pasien": {
            //             "nm_pasien": "ANDI ANUM",
            //             "no_rkm_medis": "553973",
            //             "no_ktp": "6172050606740004",
            //             "no_peserta": "0001064588376"
            //         }
            //     },
            //     "poliklinik": {
            //         "nm_poli": "Poliklinik Penyakit Dalam"
            //     },
            //     "dokter": {
            //         "nm_dokter": "dr. HARTONO KURNIAWAN, Sp.PD"
            //     }
            // },
            let dataAntrian = [];
            for (let x of data_rujukan_internal_poli) {
                // Gunakan {...} untuk cloning objek agar x.reg_periksa tidak termutasi
                let data = { ...x.reg_periksa };
                data.poliklinik = x.poliklinik;
                data.dokter = x.dokter;
                dataAntrian.push(data); // Typo 'dataAntiran' diperbaiki menjadi 'dataAntrian'
            }
            for (let x of dataAntrian) {
                x.stts = 'Rujukan Internal Poli';
            }

            return res.status(200).json({
                status: true,
                message: 'Data antrean',
                record: data_rujukan_internal_poli.length,
                data: dataAntrian
            })
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });
        }


    },
    getPemeriksaan: async (req, res) => {
        try {
            let query = req.query;
            let dataPemeriksaan = await pemeriksaan_ralan.findAll({
                // attributes: ['no_rawat', 'tgl_perawatan', 'jam_rawat', 'nip'],
                where: {
                    no_rawat: query.no_rawat,
                },
                include: [
                    {
                        model: pegawai,
                        as: 'pegawai',
                        attributes: ['nama']
                    }],
                order: [
                    ['no_rawat', 'ASC'],
                ],
            });
            return res.status(200).json({
                status: true,
                message: 'Data pemeriksaan',
                record: dataPemeriksaan.length,
                data: dataPemeriksaan,
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    postPemeriksaan: async (req, res) => {
        try {
            let data = req.body;
            if (!data.no_rawat || !data.tgl_perawatan || !data.jam_rawat || !data.nip || !data.keluhan || !data.pemeriksaan || !data.alergi || !data.penilaian || !data.instruksi || !data.evaluasi) {
                return res.status(400).json({
                    status: false,
                    message: 'Data tidak lengkap',
                    data: 'required field: no_rawat, tgl_perawatan, jam_rawat, nip, keluhan, pemeriksaan, alergi, penilaian, instruksi, evaluasi'
                });
            }
            if (data.kesadaran == null) {
                data.kesadaran = 'Compos Mentis';
            }
            let dataPemeriksaan = await pemeriksaan_ralan.create(data);
            return res.status(200).json({
                status: true,
                message: 'Data pemeriksaan berhasil disimpan',
                data: dataPemeriksaan,
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Data pemeriksaan gagal disimpan',
                data: err.message
            });

        }
    },
    updatePemeriksaan: async (req, res) => {
        try {
            let data = req.body;
            if (!data.no_rawat || !data.tgl_perawatan || !data.jam_rawat || !data.nip || !data.keluhan || !data.pemeriksaan || !data.alergi || !data.penilaian || !data.instruksi || !data.evaluasi) {
                return res.status(400).json({
                    status: false,
                    message: 'Data tidak lengkap',
                    data: 'required field: no_rawat, tgl_perawatan, jam_rawat, nip, keluhan, pemeriksaan, alergi, penilaian, instruksi, evaluasi'
                });
            }
            if (data.kesadaran == null) {
                data.kesadaran = 'Compos Mentis';
            }
            let dataPemeriksaan = await pemeriksaan_ralan.update(data, { where: { no_rawat: data.no_rawat, nip: data.nip, tgl_perawatan: data.tgl_perawatan, jam_rawat: data.jam_rawat } });
            return res.status(200).json({
                status: true,
                message: 'Data pemeriksaan berhasil disimpan',
                data: dataPemeriksaan,
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Data pemeriksaan gagal disimpan',
                data: err.message
            });

        }
    },
    getRiwayatPemeriksaan: async (req, res) => {
        try {
            let query = req.query;
            let paramquery = {
                no_rkm_medis: query.no_rkm_medis,
                tgl_registrasi: query.from && query.until ? { [Op.between]: [query.from, query.until] } : { [Op.startsWith]: '' },
                no_rawat: { [Op.startsWith]: query.no_rawat ? query.no_rawat : '' },
                kd_poli: { [Op.startsWith]: query.kd_poli ? query.kd_poli : '' },
                status_lanjut: 'Ralan'
            };
            let dataRegPriksa = await reg_periksa.findAll({
                attributes: ['no_rawat'],
                where: paramquery,
                include: [
                    {
                        model: pemeriksaan_ralan,
                        as: 'pemeriksaan_ralan',
                        include: [
                            {
                                model: pegawai,
                                as: 'pegawai',
                                attributes: ['nama']
                            }]
                    }
                ],
                order: [
                    ['no_rawat', 'DESC'],
                ],
            })
            let dataSoap = [];
            for (let x of dataRegPriksa) {
                if (x.pemeriksaan_ralan.length > 0) {
                    dataSoap.push(...x.pemeriksaan_ralan);
                }
            }

            return res.status(200).json({
                status: true,
                message: 'Data pemeriksaan',
                record: dataRegPriksa.length,
                recordPemeriksaan: dataRegPriksa,
                data: dataSoap
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    getBerkasRiwayat: async (req, res) => {
        try {
            let query = req.query;
            let paramquery = {
                no_rkm_medis: query.no_rkm_medis
            };
            let dataRegPriksa = await reg_periksa.findAll({
                attributes: ['no_rawat'],
                where: paramquery,
                include: [
                    {
                        model: berkas_digital_perawatan,
                        as: 'berkas_digital_perawatan',
                        include: [
                            {
                                model: master_berkas_digital,
                                as: 'master_berkas_digital',
                                attributes: ['nama']
                            }
                        ]
                    }
                ]
            })
            let databerkas = [];
            for (let x of dataRegPriksa) {
                console.log(x.berkas_digital_perawatan);
                if (x.berkas_digital_perawatan != null) {
                    databerkas.push(x.berkas_digital_perawatan);
                }
            }
            for (let x of databerkas) {
                x.lokasi_file = '/api/' + x.lokasi_file;
            }

            return res.status(200).json({
                status: true,
                message: 'Data pemeriksaan',
                record: databerkas.length,
                data: databerkas
            });

        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    },
    getAntrianFarmasi: async (req, res) => {
        try {
            let query = req.query;
            console.log(query);
            if (!query.status || !query.tgl_peresepan) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    data: 'Parameter status dan tgl_peresepan harus diisi'
                });
            }
            if (query.status !== 'ralan' && query.status !== 'ranap') {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    data: 'Parameter status harus Ralan/Ranap'
                });
            }
            let paramquery = {
                status: query.status,
                tgl_peresepan: query.tgl_peresepan,
            };
            if (query.penyerahan == '1') {
                paramquery = {
                    ...paramquery,
                    tgl_penyerahan: {
                        [Op.ne]: '0000-00-00'
                    }
                };
            } else if (query.penyerahan == '0') {
                paramquery = {
                    ...paramquery,
                    tgl_penyerahan: {
                        [Op.eq]: '0000-00-00'
                    }
                };
            }
            let data_antrian_resep = await resep_obat.findAll({
                where: paramquery,
                attributes: ['no_resep', 'no_rawat', 'tgl_peresepan', 'jam_peresepan', 'tgl_penyerahan', 'jam_penyerahan'
                ],
                include: [
                    {
                        model: reg_periksa,
                        as: 'reg_periksa',
                        attributes: ['kd_poli', 'status_lanjut'],
                        where: {
                            kd_poli: {
                                [Op.ne]: 'IGDK'
                            }
                        },
                        include: [
                            {
                                model: pasien,
                                as: 'pasien',
                                attributes: ['nm_pasien', 'no_rkm_medis']
                            },
                            {
                                model: poliklinik,
                                as: 'poliklinik',
                                attributes: ['nm_poli']
                            },
                        ]
                    }
                ],
            })
            console.log(data_antrian_resep);
            return res.status(200).json({
                status: true,
                message: 'Data pemeriksaan',
                record: data_antrian_resep.length,
                data: data_antrian_resep
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err.message
            });

        }
    }

}
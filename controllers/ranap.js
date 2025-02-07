'use strict';
const { reg_periksa, pasien, kamar_inap, kamar, bangsal, pemeriksaan_ranap, dpjp_ranap, pegawai } = require('../models');
const { Op } = require("sequelize");
module.exports = {
    getRanap: async (req, res) => {
        try {
            const param = req.query;
            if (!param.limit) {
                param.limit = 10;
            }
            let reg = await reg_periksa.findAll({

                attributes: ['no_rawat', 'no_rkm_medis'],
                where: {
                    [Op.and]: [
                        { status_lanjut: 'Ranap' },
                        {
                            [Op.or]: [
                                { no_rawat: { [Op.substring]: param.search } },
                                { no_rkm_medis: { [Op.substring]: param.search } },
                            ]
                        },
                        // { '$pasien.nm_pasien$': { [Op.substring]: param.search } },
                        // { '$kamar_inap.kd_bangsal$': { [Op.substring]: 'ZA' } },

                    ],


                    // pasien: { [Op.substring]: param.no_rkm_medis },
                    // model: pasien,
                    // where: { nm_pasien: { [Op.substring]: param.nm_pasien } },
                },
                // [Op.substring]: param.search,

                include: [
                    {
                        model: pasien,
                        as: 'pasien',
                        attributes: ['nm_pasien', 'jk', 'tgl_lahir',],
                        where: { nm_pasien: { [Op.substring]: param.nm_pasien } }
                    },
                    {
                        model: kamar_inap,
                        as: 'kamar_inap',
                        attributes: ['tgl_masuk', 'jam_masuk', 'kd_kamar'],
                        where: {
                            [Op.and]: [
                                { tgl_keluar: '0000-00-00' },
                                // { '$kamar.kd_bangsal$': { [Op.substring]: 'ZA' } }
                                // {
                                // [Op.or]: [

                                // ]
                                // }
                            ]
                        },
                        include: [
                            {
                                model: kamar,
                                as: 'kode_kamar',
                                attributes: ['kd_bangsal', 'kelas'],
                                // where: { kd_bangsal: { [Op.substring]: 'ZA' } },
                                include: [
                                    {
                                        model: bangsal,
                                        attributes: ['nm_bangsal'],
                                        // where: { kd_bangsal: { [Op.substring]: param.nm_bangsal } },
                                        // where: { kd_bangsal: { [Op.substring]: 'ZA' } },
                                    }
                                ]
                            },
                        ],
                    },

                ],
                limit: parseInt(param.limit),
                order: [
                    ['no_rawat', 'DESC']
                ],
            });

            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: reg.length,
                // recordall: count,
                // data: find,
                // data: dataReg,
                data: reg,
            });
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    getTglMasuk: async (req, res) => {
        try {
            const param = req.query;
            let rawatPasien = await kamar_inap.findAll({
                attributes: ['no_rawat','tgl_masuk', 'jam_masuk', 'tgl_keluar', 'jam_keluar', 'kd_kamar'],
                where: {
                    tgl_masuk: { [Op.between]: [param.from, param.until] },
                    '$kode_kamar.kd_bangsal$': { [Op.substring]: param.kd_bangsal } ,
                    // and or 
                    [Op.or]: [
                        { no_rawat: { [Op.substring]: param.search } },
                        { kd_kamar: { [Op.substring]: param.search } },
                        
                        { '$kode_kamar.kelas$': { [Op.substring]: param.search } },
    
                        { '$reg_periksa.no_rkm_medis$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.nm_pasien$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.jk$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.tmp_lahir$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.tgl_lahir$': { [Op.substring]: param.search } },

                    ],
                },
                include: [
                    {
                        model: kamar,
                        as: 'kode_kamar',
                        attributes: ['kd_bangsal', 'kelas'],
                        include: [
                            {
                                model: bangsal,
                                as: 'bangsal',
                                attributes: ['nm_bangsal'],
                            }
                        ]
                    },
                    {
                        model: reg_periksa,
                        as: 'reg_periksa',
                        attributes: ['no_rkm_medis'],
                        include: [{
                            model: pasien,
                            as: 'pasien',
                            attributes: ['nm_pasien', 'jk', 'tgl_lahir', 'tmp_lahir']
                        }]
                    },

                ]
            });
            let data = rawatPasien.map((item) => {
                return {
                    no_rawat: item.no_rawat,
                    no_rkm_medis: item.reg_periksa.no_rkm_medis,
                    nm_pasien: item.reg_periksa.pasien.nm_pasien,
                    jk: item.reg_periksa.pasien.jk,
                    tgl_lahir: item.reg_periksa.pasien.tgl_lahir,
                    tmp_lahir: item.reg_periksa.pasien.tmp_lahir,
                    tgl_masuk: item.tgl_masuk,
                    jam_masuk: item.jam_masuk,
                    tgl_keluar: item.tgl_keluar,
                    jam_keluar: item.jam_keluar,
                    nm_bangsal: item.kode_kamar.bangsal.nm_bangsal,
                    kd_bangsal: item.kode_kamar.kd_bangsal,
                    kd_kamar: item.kd_kamar,
                    kelas: item.kode_kamar.kelas,
                }
            });
            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: rawatPasien.length,
                data: data,
                queryParam: param,
            });

        } catch (err) {
            console.log(err)
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    getBp: async (req, res) => {
        try {
            const param = req.query;
            let rawatPasien = await kamar_inap.findAll({
                attributes: ['no_rawat', 'kd_kamar'],
                where: {
                    // tgl_masuk: { [Op.between]: [param.from, param.until] },
                    tgl_keluar:'0000-00-00',
                    '$kode_kamar.kd_bangsal$': { [Op.substring]: param.kd_bangsal } ,
                    
                    // and or
                    [Op.or]: [
                        { no_rawat: { [Op.substring]: param.search } },
                        { kd_kamar: { [Op.substring]: param.search } },
                        { '$kode_kamar.kelas$': { [Op.substring]: param.search } },
                        { '$reg_periksa.no_rkm_medis$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.nm_pasien$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.jk$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.tmp_lahir$': { [Op.substring]: param.search } },
                        { '$reg_periksa.pasien.tgl_lahir$': { [Op.substring]: param.search } },
                    ]
                },
                include: [
                    {
                        model: kamar,
                        as: 'kode_kamar',
                        attributes: ['kd_bangsal', 'kelas'],
                        include: [
                            {
                                model: bangsal,
                                attributes: ['nm_bangsal'],
                            }
                        ]
                    },
                    {
                        model: reg_periksa,
                        attributes: ['no_rkm_medis'],
                        include: [{
                            model: pasien,
                            as: 'pasien',
                            attributes: ['nm_pasien', 'jk', 'tgl_lahir', 'tmp_lahir']
                        }]
                    },
                ]
            });
            let data = rawatPasien.map((item) => {
                return {
                    no_rawat: item.no_rawat,
                    no_rkm_medis: item.reg_periksa.no_rkm_medis,
                    nm_pasien: item.reg_periksa.pasien.nm_pasien,
                    jk: item.reg_periksa.pasien.jk,
                    tgl_lahir: item.reg_periksa.pasien.tgl_lahir,
                    tmp_lahir: item.reg_periksa.pasien.tmp_lahir,
                    tgl_masuk: item.tgl_masuk,
                    jam_masuk: item.jam_masuk,
                    tgl_keluar: item.tgl_keluar,
                    jam_keluar: item.jam_keluar,
                    nm_bangsal: item.kode_kamar.bangsal.nm_bangsal,
                    kd_bangsal: item.kode_kamar.kd_bangsal,
                    kd_kamar: item.kd_kamar,
                    kelas: item.kode_kamar.kelas,
                }
            });
            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: rawatPasien.length,
                data: data,
                queryParam: param,
            });
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    getKamar: async (req, res) => {
        try {
            let cacheKamar = await req.cache.json.get(`API-Khnza:kamars:${req.query.nm_bangsal}`, '$');
            if (!cacheKamar) {
            let dataKamar = await bangsal.findAll({
                attributes: { exclude: ['status'] },
                where: {

                    [Op.and]: [
                        { '$kamars.statusdata$': '1', },
                        { nm_bangsal: { [Op.substring]: req.query.nm_bangsal } },
                    ]
                },
                include: [
                    {
                        model: kamar,
                        attributes: { exclude: ['statusdata'] },
                    }
                ],
            });
            dataKamar = dataKamar.filter((item) => {
                return item.kamars.length > 0;
            });
                cacheKamar = dataKamar;
                req.cache.json.set(`API-Khnza:kamars:${req.query.nm_bangsal}`, '$', dataKamar);
                req.cache.expire(`API-Khnza:kamars:${req.query.nm_bangsal}`, 3600 * 24);
            } 
            return res.status(200).json({
                status: true,
                message: 'Data kamar',
                record: cacheKamar.length,
                data: cacheKamar,
            });
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }

    },
    getBelumPulang: async (req, res) => {
        try {
            const param = req.query;

            if (param.kd_bangsal == undefined) {
                param.kd_bangsal = "";
            }
            const rawatInap = await kamar_inap.findAll({
                attributes: [
                    "no_rawat",
                    "tgl_masuk",
                    "tgl_masuk",
                    "kd_kamar",
                    "stts_pulang",
                ],
                where: {
                    stts_pulang: "-",
                },
                include: [
                    {
                        model: kamar,
                        as: "kode_kamar",
                        attributes: ["status","kd_bangsal", "kelas"],
                        where: {
                            kd_bangsal: { [Op.substring]: param.kd_bangsal }
                        },
                        include: [
                            {
                                model: bangsal,
                                as: "bangsal",
                                attributes: ["nm_bangsal"],
                            },
                        ],
                    },
                    {
                        model: reg_periksa,
                        as: "reg_periksa",
                        attributes: ["no_rkm_medis"],
                        include: [
                            {
                                model: pasien,
                                as: "pasien",
                                attributes: ["nm_pasien"],
                            }],
                    },
                ],
                order: [
                    ['kd_kamar', 'DESC'],
                ],
            });
     for (let i of rawatInap) {
        if (i.kode_kamar.status == 'KOSONG') {
        console.log(i.kd_kamar)
        await kamar.update({ status: 'ISI' }, { where: { kd_kamar: i.kd_kamar } })
        }
        
     }
            return res.status(200).json({
                status: true,
                message: "Stastistik Rawat Inap belum pulang",
                record: rawatInap.length,
                data: rawatInap,
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: "Bad Request",
                data: err,
            });
        }
    },
    getPemeriksaan: async (req, res) => {
        try {
            const query = req.query;
            const pemeriksaan = await pemeriksaan_ranap.findAll({
                where: {
                    no_rawat: query.no_rawat,
                },
                include: [
                    {
                        model: pegawai,
                        as: 'pegawai',
                        attributes: ['nama']
                    }
                ],
            });
            return res.status(200).json({
                status: true,
                message: "Stastistik pemeriksaan pasien rawat inap",
                record: pemeriksaan.length,
                data: pemeriksaan
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: "Bad Request",
                data: err,
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
            let dataPemeriksaan = await pemeriksaan_ranap.create(data);
            return res.status(200).json({
                status: true,
                message: "Stastistik pemeriksaan pasien rawat inap",
                record: dataPemeriksaan,
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: "Bad Request",
                data: err,
            });
        }
    },
    getPxdpjp: async (req, res) => {
        try {
            const { nik, id } = req.query;
            let isExistDPJP = await pegawai.findOne({
                where: {
                    no_ktp: nik,
                    nik: id,
                },
                attributes: ['nik', 'nama', 'no_ktp']
            });
            if (!isExistDPJP) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Data DPJP tidak ditemukan",
                });
            }
            let dataRanap = await kamar_inap.findAll({
                where: {
                    stts_pulang: "-",
                    '$dpjp_ranap.kd_dokter$': id
                },
                attributes: ['no_rawat', 'tgl_masuk', 'kd_kamar', 'kd_kamar', 'diagnosa_awal'],
                include: [
                    {
                        model: reg_periksa,
                        as: 'reg_periksa',
                        attributes: ['no_rkm_medis'],
                        include: [
                            {
                                model: pasien,
                                as: 'pasien',
                                attributes: ['nm_pasien', 'tgl_lahir', 'jk'],
                            }],
                    }, {
                        model: kamar,
                        as: 'kode_kamar',
                        attributes: ['kd_bangsal', 'kelas'],
                        include: [
                            {
                                model: bangsal,
                                as: 'bangsal',
                                attributes: ['nm_bangsal']
                            }
                        ]
                    },
                    {
                        model: dpjp_ranap,
                        as: 'dpjp_ranap',
                    }
                ],
            });

            return res.status(200).json({
                status: true,
                message: "Data pasien rawat inap",
                record: dataRanap.length,
                attributes: isExistDPJP,
                data: dataRanap,
            });
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: "Bad Request",
                data: err,
            });
        }    
    }

}
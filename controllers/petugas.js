const { dokter, petugas, jabatan, pasien, kelurahan, kecamatan, kabupaten, penjab, spesialis } = require('../models');
const { Op } = require("sequelize");
module.exports = {
    getDokter: async (req, res) => {
        try {
            const param = req.query;
            if (!param.limit) {
                param.limit = 10;
            }
            if (!param.search) {
                param.search = '';
            }
            let data = await dokter.findAll({
                attributes: { exclude: ['kd_sps'] },
                where: {
                    [Op.or]: [
                        { kd_dokter: { [Op.substring]: param.search } },
                        { nm_dokter: { [Op.substring]: param.search } },
                    ]
                },
                limit: parseInt(param.limit)
            });

            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: data.length,
                data: data,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: error,
            });
        }

    },
    getDetailDokter: async (req, res) => {
        try {
            const { id } = req.params;
            let data = await dokter.findOne({
                attributes: { exclude: ['kd_sps'] },
                where: {
                    kd_dokter: id
                },
                include: [{
                    model: spesialis,
                    attributes: ['nm_sps'],
                }],

            });
            if (!data) {
                return res.status(404).json({
                    status: false,
                    message: 'NIK tidak ditemukan',
                    data: {
                        nik: id,
                    },
                });
            }
            let dataDokter = {
                kd_dokter: data.kd_dokter,
                nm_dokter: data.nm_dokter,
                jk: data.jk,
                tgl_lahir: data.tgl_lahir,
                no_ijn_praktek: data.no_ijn_praktek,
                specialis: data.spesiali.nm_sps,
            }
            return res.status(200).json({
                status: true,
                message: 'Data Dokter',
                data: dataDokter,
                // data: data,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: error,
            });
        }
    },

    getPerawat: async (req, res) => {
        try {
            const param = req.query;
            if (!param.limit) {
                param.limit = 10;
            }
            if (!param.search) {
                param.search = '';
            }
            var data = await petugas.findAll({
                attributes: ['nip', 'nama', 'jk'],
                where: {
                    [Op.or]: [
                        { nip: { [Op.substring]: param.search } },
                        { nama: { [Op.substring]: param.search } },
                    ]
                },
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['nm_jbtn'],
                }],
                limit: parseInt(param.limit)
            });
            data = data.map((item) => {
                return {
                    nip: item.nip,
                    nama: item.nama,
                    jk: item.jk,
                    jabatan: item.jabatan.nm_jbtn,
                }
            });
            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: data.length,
                data: data,
            });

        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: error,
            });
        }
    },
    getDetailPerawat: async (req, res) => {
        try {
            const { id } = req.params;
            let data = await petugas.findOne({
                attributes: ['nip', 'nama', 'jk'],
                where: {
                    nip: id
                },
                include: [{
                    model: jabatan,
                    as: 'jabatan',
                    attributes: ['nm_jbtn'],
                }],
            });
            if (!data) {
                return res.status(404).json({
                    status: false,
                    message: 'NIK tidak ditemukan',
                    data: {
                        nik: id,
                    },
                });
            }
            let dataPetugas = {
                nip: data.nip,
                nama: data.nama,
                jk: data.jk,
                jabatan: data.jabatan.nm_jbtn,
            }
            return res.status(200).json({
                status: true,
                message: 'Data Petugas',
                data: dataPetugas,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: error,
            });
        }
    },
    getPasien: async (req, res) => {
        try {
            const param = req.query;
            if (!param.limit) {
                param.limit = 10;
            }
            if (param.limit > 100) {
                param.limit = 100;
            }
            if (!param.search) {
                param.search = '';
            }
            let data = await pasien.findAll({
                attributes: ['no_rkm_medis', 'nm_pasien', 'tgl_lahir', 'jk'],
                where: {
                    [Op.or]: [
                        { nm_pasien: { [Op.substring]: param.search } },
                        { tgl_lahir: { [Op.substring]: param.search } },
                        { no_rkm_medis: { [Op.substring]: param.search } },
                    ]
                },
                limit: parseInt(param.limit)
            });

            return res.status(200).json({
                status: true,
                message: 'Data ranap',
                record: data.length,
                data: data,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: error,
            });
        }

    },
    getDetailPasien: async (req, res) => {
        try {
            // get id from url
            const { id } = req.params;
            let dataPasien = await pasien.findOne({
                attributes: { exclude: ['kd_kel', 'kd_kec', 'kd_kab'] },
                where: {
                    no_rkm_medis: id
                },
                include: [{
                    model: kelurahan,
                    as: 'kelurahan',
                    attributes: ['nm_kel'],
                }, {
                    model: kecamatan,
                    as: 'kecamatan',
                    attributes: ['nm_kec'],
                }, {
                    model: kabupaten,
                    as: 'kabupaten/kota',
                    attributes: ['nm_kab'],
                }, {
                    model: penjab,
                    attributes: ['png_jawab'],
                }]
            });
            if (!dataPasien) {
                return res.status(404).json({
                    status: false,
                    message: 'Data pasien tidak ditemukan',
                    data: {
                        no_rkm_medis: id
                    },
                });
            }
            let data = {
                no_rkm_medis: dataPasien.no_rkm_medis,
                nm_pasien: dataPasien.nm_pasien,
                jk: dataPasien.jk,
                tgl_lahir: dataPasien.tgl_lahir,
                alamat: dataPasien.alamat,
                no_ktp: dataPasien.no_ktp,
                kelurahan: dataPasien.kelurahan.nm_kel,
                kecamatan: dataPasien.kecamatan.nm_kec,
                kabupaten: dataPasien['kabupaten/kota'].nm_kab,
                no_tlp: dataPasien.no_tlp,
                pekerjaan: dataPasien.pekerjaan,
                agama: dataPasien.agama,
                nm_ibu: dataPasien.nm_ibu,
                asuransi: dataPasien.penjab.png_jawab,
                no_peserta: dataPasien.no_peserta,
            };
            return res.status(200).json({
                status: false,
                message: 'Data pasien',
                data: data,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: 'Internal Server Error',
                data: error,
            });
        }
    },
};
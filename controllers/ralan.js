'use strict';
const { reg_periksa, pasien, dokter, poliklinik, jadwal, pegawai, pemeriksaan_ralan } = require('../models');
const { Op } = require("sequelize");
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
    }

}
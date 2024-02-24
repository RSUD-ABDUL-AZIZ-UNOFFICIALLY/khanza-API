'use strict';
const { reg_periksa, pasien, dokter, poliklinik, jadwal, pegawai, pemeriksaan_ralan, bridging_sep, dpjp_ranap, operasi, paket_operasi, bangsal, kamar, kamar_inap, maping_dokter_dpjpvclaim } = require('../models');
const moment = require('moment');
const axios = require('axios');
const { Op } = require("sequelize");
const fs = require('fs');
const sha256 = require('js-sha256');
const e = require('express');
const { url } = require('inspector');
const url_bpjs = process.env.URL_BPJS
const {
    BPJS_Setujui,
    formasi,
    penujang,
    medis,
    OKA,
    ventilator,
    findProlist,
    penujangRajal
} = require('../helpers/kalkulator');
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
    },
    getJasaRalan: async (req, res) => {
        if (!req.query.from || !req.query.until || !req.query.status) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: 'required field: from, until'
            });
        }
        try {
            let from = moment(req.query.from);
            let until = moment(req.query.until);
            let pelayanan = req.query.pelayanan;
            let status = req.query.status;
            let sttinacbg = req.query.inacbg;
            let pxOK = 0;
            let TarifBPJS = 0;
            let TarifRS = 0;

            const dateList = [];
            let klaim = [];
            while (from.isSameOrBefore(until, 'day')) {
                dateList.push(from.format('YYYY-MM-DD'));
                from.add(1, 'day');
            }

            const getData = await axios.get(url_bpjs + '/api/bpjs/monit?from=' + req.query.from + '&until=' + req.query.until + '&pelayanan=' + pelayanan + '&status=' + status);

            klaim = getData.data.response.data;
            if (status == 1 || status == 2) {
                return res.status(200).json({
                    status: true,
                    message: 'Data klaim',
                    record: klaim.length,
                    data: klaim,
                });
            }

            const fileContent = fs.readFileSync('controllers/inacbg/inac.json', 'utf-8');
            let inacbg = JSON.parse(fileContent);
            for (const element of klaim) {
                // find map inacbg to klaim by noSEP
                if (sttinacbg == 1) {
                    element.data_inacbg = {
                        // SEP: typeof (inacbg.find(obj => obj.SEP === element.noSEP)),
                        SEP: inacbg.find(obj => obj.SEP === element.noSEP),
                        // DESKRIPSI_INACBG: inacbg.find(obj => obj.SEP === element.noSEP).DESKRIPSI_INACBG,
                        // TOTAL_TARIF: inacbg.find(obj => obj.SEP === element.noSEP).TOTAL_TARIF,
                        // TARIF_RS: inacbg.find(obj => obj.SEP === element.noSEP).TARIF_RS,
                        // DPJP: inacbg.find(obj => obj.SEP === element.noSEP).DPJP,
                        // CODER_ID: inacbg.find(obj => obj.SEP === element.noSEP).CODER_ID,
                        // PROSEDUR_NON_BEDAH: inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_NON_BEDAH,
                        // PROSEDUR_BEDAH: inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_BEDAH,
                    }
                }
                let dataSEP = await bridging_sep.findOne({
                    where: {
                        no_sep: element.noSEP,
                    },
                    attributes: ['no_rawat', 'nomr', 'no_sep', 'nmdiagnosaawal', 'nmdpdjp'],
                });
                if (dataSEP == null) {
                    console.log("Data SEP tidak ditemukan");
                    let getDataSEP = await axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + element.noSEP);
                    getDataSEP = getDataSEP.data.response;
                    let get_reg = await reg_periksa.findOne({
                        where: {
                            tgl_registrasi: getDataSEP.tglSep,
                            no_rkm_medis: getDataSEP.peserta.noMr
                        },
                        attributes: ['no_rawat'],
                    });
                    dataSEP = {
                        no_rawat: get_reg.no_rawat,
                        nomr: getDataSEP.peserta.noMr,
                        no_sep: getDataSEP.noSep,
                        nmdiagnosaawal: getDataSEP.diagnosa,
                        nmdpdjp: getDataSEP.dpjp.nmDPJP
                    }

                } else {
                    element.dataSEP = dataSEP;
                }
                if (pelayanan == 1) {
                    let dpjp = await dpjp_ranap.findAll({
                        where: {
                            no_rawat: dataSEP.no_rawat,
                        },
                        attributes: ['kd_dokter'],
                        include: [{
                            model: dokter,
                            as: 'dokter',
                            attributes: ['nm_dokter']
                        }],
                    });
                    element.dpjp_ranap = dpjp.length;
                    element.data_dpjp_ranap = dpjp;
                    // klaim[i].data_dpjp_ranap = null;
                    let lastKamar = await kamar_inap.findOne({
                        where: {
                            no_rawat: dataSEP.no_rawat,
                            stts_pulang: {
                                [Op.notIn]: ['Pindah Kamar', '-']
                            },
                        },
                        include: [{
                            model: kamar,
                            as: 'kode_kamar',
                            attributes: ['kelas'],
                            include: [{
                                model: bangsal,
                                as: 'bangsal',
                                attributes: ['nm_bangsal']
                            }]
                        }],
                        attributes: ['kd_kamar', 'tgl_masuk', 'tgl_keluar', 'stts_pulang'],
                    });
                    element.bangsal = lastKamar;


                    // if (inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_BEDAH > 0) {
                    //     element.px_bedah = 1
                    //     pxOK++
                    //     let data_operasi = await operasi.findAll({
                    //         where: {
                    //             no_rawat: dataSEP.no_rawat,
                    //         },
                    //         attributes: ['tgl_operasi', 'kategori', 'jenis_anasthesi', 'biayasarpras', 'biayainstrumen', 'operator1', 'dokter_anestesi'],
                    //         include: [
                    //             {
                    //                 model: dokter,
                    //                 as: 'dr_operator1',
                    //                 attributes: ['nm_dokter']
                    //             },
                    //             {
                    //                 model: dokter,
                    //                 as: 'dr_anestesi',
                    //                 attributes: ['nm_dokter']
                    //             },
                    //             {
                    //                 model: paket_operasi,
                    //                 as: 'paket_operasi'
                    //             }],
                    //     });
                    //     element.data_operasi = data_operasi;
                    // } else {
                    //     element.px_bedah = 0
                    // }
                }

                const oldVal = element.biaya.byTarifRS;
                const newVal = element.biaya.bySetujui;

                // Calculate percentage increase
                const percentageIncrease = ((newVal - oldVal) / oldVal) * 100;
                element.biaya.persentase = percentageIncrease.toFixed(2);
                element.biaya.selisih = newVal - oldVal;
                TarifRS = parseInt(element.biaya.byTarifRS) + parseInt(TarifRS);
                TarifBPJS = parseInt(element.biaya.bySetujui) + parseInt(TarifBPJS);
            }
            fs.writeFile('./cache/data.json', JSON.stringify(klaim), (err, klaim) => {
                if (err) {
                    console.log("File read failed:", err);
                    return;
                }
                console.log("File data:", klaim);
            });
            return res.status(200).json({
                status: true,
                message: 'Data klaim',
                record: klaim.length,
                PxOK: pxOK,
                TarifRS: TarifRS,
                TarifBPJS: TarifBPJS,
                data: klaim,
            });
        } catch (error) {
            console.log(error);
            return res.status(400).json({
                status: false,
                message: 'Data pemeriksaan gagal disimpan',
                data: error.message
            });


        }
    },
    getJasaRuangan: async (req, res) => {
        try {
            let param = req.query;
            let token = JSON.stringify(param)
            token = sha256(token);
            const protocol = req.protocol;
            const host = req.hostname;
            const port = process.env.PORT || 3000;
            const fullUrl = `${protocol}://${host}:${port}/api/cache/`
            let klaim = [];
            if (fs.existsSync('cache/' + token + '.json')) {
                const fileContent = fs.readFileSync('cache/' + token + '.json');
                klaim = JSON.parse(fileContent);
            } else {
                const getData = await axios.get(url_bpjs + '/api/bpjs/monit?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=' + param.status);
                klaim = getData.data.response.data;

                fs.writeFile('./cache/' + token + '.json', JSON.stringify(klaim), (err, klaim) => {
                    if (err) {
                        console.log("File read failed:", err);
                        return;
                    }
                    console.log("File data:", klaim);
                });
            }
            if (param.status == 1 || param.status == 2) {
                return res.status(200).json({
                    status: true,
                    message: 'Data klaim',
                    record: klaim.length,
                    data: klaim,
                });
            }

            if (param.pelayanan == 2) {
                let dataRalan = [];
                let filename = 'ralan_' + token + '.json'
                    for (const element of klaim) {
                        let dataKlaim
                        let dataSEP = await bridging_sep.findOne({
                            where: {
                                no_sep: element.noSEP,
                            },
                            attributes: ['nomr', 'tanggal_lahir', 'nmdiagnosaawal', 'nmdpdjp', 'kddpjp'],
                        });

                        if (dataSEP == null) {
                            let getDataSEP = await axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + element.noSEP);
                            element.dataSEP = getDataSEP.data.response;
                            let id_dokter = getDataSEP.data.response.dpjp.kdDPJP;
                            // if (getDataSEP.dpjp.kdDPJP == "0") {
                            //     id_dokter = getDataSEP.kontrol.kdDokter
                            // } else {
                            //     id_dokter = getDataSEP.dpjp.kdDPJP
                            // }
                            let maping = await maping_dokter_dpjpvclaim.findOne({
                                where: {
                                    kd_dokter_bpjs: id_dokter,
                                },
                                attributes: ['kd_dokter'],
                                include: [{
                                    model: dokter,
                                    as: 'dokter',
                                    attributes: ['nm_dokter']
                                }],
                            });

                            dataKlaim = {
                                noFPK: element.noFPK,
                                tglSep: element.tglSep,
                                noSEP: element.noSEP,
                                kelasRawat: element.kelasRawat,
                                poli: element.poli,
                                tarifbyTarifGruper: element.biaya.byTarifGruper,
                                tarifbyTarifRS: element.biaya.byTarifRS,
                                tarifbySetujui: parseInt(element.biaya.bySetujui),
                                pesertaNama: element.peserta.nama,
                                pesertaNoMr: element.peserta.noMr,
                                peserta_tglLahir: element.dataSEP.peserta.tglLahir,
                                pesertaNoBPJS: element.dataSEP.peserta.noKartu,
                                pesertahakKelas: element.dataSEP.peserta.hakKelas,
                                inacbg_kode: element.Inacbg.kode,
                                inacbg_nama: element.Inacbg.nama,
                                diagnosa_sep: element.dataSEP.diagnosa,
                                dpjp: maping.dokter.nm_dokter,
                                kdDPJP: id_dokter,
                            }
                        } else {
                            if (dataSEP.nmdpdjp == "null") {
                                let getDataSEP = await axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + element.noSEP);
                                element.dataSEP = getDataSEP.data.response;
                                dataSEP.kddpjp = getDataSEP.data.response.dpjp.kdDPJP;
                            }
                            let maping = await maping_dokter_dpjpvclaim.findOne({
                                where: {
                                    kd_dokter_bpjs: dataSEP.kddpjp,
                                },
                                attributes: ['kd_dokter'],
                                include: [{
                                    model: dokter,
                                    as: 'dokter',
                                    attributes: ['nm_dokter']
                                }],
                            });
                            if (maping == null) {
                                console.log("Data dokter tidak ditemukan");
                                console.log(dataSEP.kddpjp);
                            }
                            let totaltarif = parseInt(element.biaya.bySetujui);
                            let bagi_rs = BPJS_Setujui(totaltarif);
                            let data_penujangRajal = penujangRajal(bagi_rs.Jasa_pelayanan);
                            dataKlaim = {
                                noFPK: element.noFPK,
                                tglSep: element.tglSep,
                                noSEP: element.noSEP,
                                kelasRawat: element.kelasRawat,
                                poli: element.poli,
                                tarifbyTarifGruper: element.biaya.byTarifGruper,
                                tarifbyTarifRS: element.biaya.byTarifRS,
                                pesertaNama: element.peserta.nama,
                                pesertaNoMr: element.peserta.noMr,
                                pesertaNoBPJS: element.peserta.noKartu,
                                pesertahakKelas: element.peserta.hakKelas,
                                inacbg_kode: element.Inacbg.kode,
                                inacbg_nama: element.Inacbg.nama,
                                diagnosa_sep: dataSEP.nmdiagnosaawal,
                                dpjp: maping.dokter.nm_dokter,
                                tarifbySetujui: totaltarif,
                                Jasa_sarana: bagi_rs.Jasa_sarana,
                                Jasa_pelayanan: bagi_rs.Jasa_pelayanan,
                                BJP_strutural: data_penujangRajal.BJP_strutural,
                                penujang_medis: data_penujangRajal.penujang_medis,
                                mikro: data_penujangRajal.mikro,
                                lab: data_penujangRajal.lab,
                                farmasi: data_penujangRajal.farmasi,
                                radiologi: data_penujangRajal.radiologi,
                                medis: data_penujangRajal.medis,
                                dokter_48: data_penujangRajal.dokter_48,
                                perawat_31: data_penujangRajal.perawat_31,
                                managemnt_21: data_penujangRajal.managemnt_21,
                            }
                        }
                        dataRalan.push(dataKlaim);
                    }
                    fs.writeFile('./cache/' + filename, JSON.stringify(dataRalan), (err, dataRalan) => {
                        if (err) {
                            console.log("File read failed:", err);
                            return;
                        }
                        console.log("File data:", dataRalan);
                    });

                return res.status(200).json({
                    status: true,
                    message: 'Data klaim Ralan',
                    url: fullUrl + filename,
                    record: klaim.length,
                    data: dataRalan,
                });
            }
            // ranap
            if (param.pelayanan == 1) {
                let filename = 'Ranap_' + token + '.json'
                let dataRanap = [];
                const fileContent = fs.readFileSync('controllers/inacbg/inacbg_sep2023.json', 'utf-8');
                let inacbg = JSON.parse(fileContent);
                for (const element of klaim) {
                    let dataSEP = await bridging_sep.findOne({
                        where: {
                            no_sep: element.noSEP,
                        },
                        attributes: ['no_rawat', 'nomr', 'no_sep', 'nmdiagnosaawal', 'kddpjp', 'nmdpdjp'],
                    });
                    if (dataSEP == null) {
                        console.log("Data SEP tidak ditemukan");
                        let getDataSEP = await axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + element.noSEP);
                        getDataSEP = getDataSEP.data.response;
                        let get_reg = await reg_periksa.findOne({
                            where: {
                                tgl_registrasi: getDataSEP.tglSep,
                                no_rkm_medis: getDataSEP.peserta.noMr
                            },
                            attributes: ['no_rawat'],
                        });
                        let id_dokter = getDataSEP.kontrol.kdDokter;
                        if (getDataSEP.dpjp.kdDPJP == "0") {
                            id_dokter = getDataSEP.kontrol.kdDokter
                        } else {
                            id_dokter = getDataSEP.dpjp.kdDPJP
                        }
                        let maping = await maping_dokter_dpjpvclaim.findOne({
                            where: {
                                kd_dokter_bpjs: id_dokter,
                            },
                            attributes: ['kd_dokter'],
                            include: [{
                                model: dokter,
                                as: 'dokter',
                                attributes: ['nm_dokter']
                            }],
                        });

                        dataSEP = {
                            no_rawat: get_reg.no_rawat,
                            nomr: getDataSEP.peserta.noMr,
                            no_sep: getDataSEP.noSep,
                            nmdiagnosaawal: getDataSEP.diagnosa,
                            nmdpdjp: getDataSEP.dpjp.nmDPJP,
                            nm_dokter: maping.dokter.nm_dokter

                        }

                    } else {
                        element.dataSEP = dataSEP;
                        let maping = await maping_dokter_dpjpvclaim.findOne({
                            where: {
                                kd_dokter_bpjs: dataSEP.kddpjp,
                            },
                            attributes: ['kd_dokter'],
                            include: [{
                                model: dokter,
                                as: 'dokter',
                                attributes: ['nm_dokter']
                            }],
                        });
                        console.log(maping.dokter.nm_dokter);
                        element.dataSEP.nm_dokter = maping.dokter.nm_dokter;
                    }
                    let lastKamar = await kamar_inap.findAll({
                        where: {
                            no_rawat: dataSEP.no_rawat,
                            // stts_pulang: {
                            //     [Op.notIn]: ['Pindah Kamar', '-']
                            // },
                        },
                        include: [{
                            model: kamar,
                            as: 'kode_kamar',
                            attributes: ['kelas'],
                            include: [{
                                model: bangsal,
                                as: 'bangsal',
                                attributes: ['nm_bangsal']
                            }]
                        }],
                        attributes: ['kd_kamar', 'tgl_masuk', 'tgl_keluar', 'stts_pulang', 'lama'],
                    });
                    let reg_maksuk = await reg_periksa.findOne({
                        where: {
                            no_rawat: dataSEP.no_rawat,
                        },
                        include: [{
                            model: poliklinik,
                            as: 'poliklinik',
                            attributes: ['nm_poli']
                        }],
                        attributes: ['kd_poli'],
                    });
                    element.reg_maksuk = reg_maksuk;
                    let dpjp = await dpjp_ranap.findAll({
                        where: {
                            no_rawat: dataSEP.no_rawat,
                        },
                        attributes: ['kd_dokter'],
                        include: [{
                            model: dokter,
                            as: 'dokter',
                            attributes: ['nm_dokter']
                        }],
                    });
                    element.dpjp_ranap = dpjp.length;
                    element.data_dpjp_ranap = dpjp;
                    console.log(element.noSEP);
                    let prolis = inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST;
                    let DIAGLIST = inacbg.find(obj => obj.SEP === element.noSEP).DIAGLIST;

                    let igd = (element.reg_maksuk.poliklinik.nm_poli == 'IGD') ? true : false;
                    // let fisio = findProlist(prolis, '93.38');
                    let fisio = findProlist(prolis, '93.39');
                    let hemo = (findProlist(prolis, '39.95') || findProlist(prolis, '38.93') || findProlist(prolis, '38.95')) ? true : false;
                    let duit_karu = param.duit_karu;
                    let venti = (findProlist(prolis, '96.72') || findProlist(prolis, '96.71')) ? true : false;
                    let bedah = inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_BEDAH > 0 ? true : false;
                    let bagi_rs = BPJS_Setujui(parseInt(element.biaya.bySetujui));
                    let duit_formasi = formasi(bagi_rs.Jasa_pelayanan, venti, bedah);
                    let bagi_penujang = penujang(duit_formasi.bangsal, igd, fisio, hemo, bedah);
                    let bagi_medis = medis(bagi_penujang.sisa, duit_karu, igd);
                    let duit_oka = OKA(duit_formasi.bedah);
                    let duit_ventilator = ventilator(duit_formasi.venti);
                    let lamaInapB1 = lastKamar[0] ? lastKamar[0].lama : 0;
                    let lamaInapB2 = lastKamar[1] ? lastKamar[1].lama : 0;
                    let lamaInapB3 = lastKamar[2] ? lastKamar[2].lama : 0;
                    let lamaInapB4 = lastKamar[3] ? lastKamar[3].lama : 0;
                    let lamaInap = lamaInapB1 + lamaInapB2 + lamaInapB3 + lamaInapB4;
                    let js_pr_inapB1 = Math.round(lamaInapB1 / lamaInap * bagi_medis.pr_ruangan);
                    let js_pr_inapB2 = Math.round(lamaInapB2 / lamaInap * bagi_medis.pr_ruangan);
                    let js_pr_inapB3 = Math.round(lamaInapB3 / lamaInap * bagi_medis.pr_ruangan);
                    let js_pr_inapB4 = Math.round(lamaInapB4 / lamaInap * bagi_medis.pr_ruangan);
                    if (bedah) {
                    }



                    let dataKlaim
                    dataKlaim = {
                        noFPK: element.noFPK,
                        SEP: inacbg.find(obj => obj.SEP === element.noSEP).SEP,
                        nama_pasien: element.peserta.nama,
                        noMR: element.peserta.noMr,
                        noBPJS: element.peserta.noKartu,
                        kelasRawat: element.kelasRawat,
                        tglSep: element.tglSep,
                        tglPulang: element.tglPulang,
                        kode_inacbg_bpjs: element.Inacbg.kode,
                        nama_inacbg_bpjs: element.Inacbg.nama,
                        TOTAL_TARIF: inacbg.find(obj => obj.SEP === element.noSEP).TOTAL_TARIF,
                        TARIF_RS: element.biaya.byTarifRS,
                        TARIF_BPJS: parseInt(element.biaya.bySetujui),
                        TARIF_PROSEDUR_BEDAH: inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_BEDAH,
                        PX_BEDAH: inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_BEDAH > 0 ? 1 : 0,
                        LOS: inacbg.find(obj => obj.SEP === element.noSEP).LOS,
                        ICU_INDIKATOR: inacbg.find(obj => obj.SEP === element.noSEP).ICU_INDIKATOR,
                        ICU_LOS: inacbg.find(obj => obj.SEP === element.noSEP).ICU_LOS,
                        VENT_HOUR: inacbg.find(obj => obj.SEP === element.noSEP).VENT_HOUR,
                        jalurMasuk: element.reg_maksuk.poliklinik.nm_poli,
                        kamar1: lastKamar[0].kd_kamar + ' - stts_pulang: ' + lastKamar[0].stts_pulang + ' - ' + lastKamar[0].lama + ' hari',
                        bangsal1: lastKamar[0].kode_kamar.bangsal.nm_bangsal,
                        js_pr_inapB1: js_pr_inapB1,
                        Kamar2: lastKamar[1] ? lastKamar[1].kd_kamar + ' - stts_pulang: ' + lastKamar[1].stts_pulang + ' - ' + lastKamar[1].lama + ' hari' : null,
                        Bangsal2: lastKamar[1] ? lastKamar[1].kode_kamar.bangsal.nm_bangsal : null,
                        js_pr_inapB2: js_pr_inapB2,
                        Kamar3: lastKamar[2] ? lastKamar[2].kd_kamar + ' - stts_pulang: ' + lastKamar[2].stts_pulang + ' - ' + lastKamar[2].lama + ' hari' : null,
                        Bangsal3: lastKamar[2] ? lastKamar[2].kode_kamar.bangsal.nm_bangsal : null,
                        js_pr_inapB3: js_pr_inapB3,
                        Kamar4: lastKamar[3] ? lastKamar[3].kd_kamar + ' - stts_pulang: ' + lastKamar[3].stts_pulang + ' - ' + lastKamar[3].lama + ' hari' : null,
                        Bangsal4: lastKamar[3] ? lastKamar[3].kode_kamar.bangsal.nm_bangsal : null,
                        js_pr_inapB4: js_pr_inapB4,
                        DESKRIPSI_INACBG: inacbg.find(obj => obj.SEP === element.noSEP).DESKRIPSI_INACBG,
                        DIAGLIST: String(DIAGLIST),
                        PROCLIST: String(prolis),
                        DPJP_INACBG: inacbg.find(obj => obj.SEP === element.noSEP).DPJP,
                        dpjp_ranap_bpj: dataSEP.nm_dokter,
                        dpjp_ranap_RS1: dpjp[0] ? dpjp[0].dokter.nm_dokter : null,
                        dpjp_ranap_RS2: dpjp[1] ? dpjp[1].dokter.nm_dokter : null,
                        dpjp_ranap_RS3: dpjp[2] ? dpjp[2].dokter.nm_dokter : null,
                        dpjp_ranap_RS4: dpjp[3] ? dpjp[3].dokter.nm_dokter : null,
                        ventilation_more96: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.72') ? "Y" : "N",
                        ventilation_less96: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.71') ? "Y" : "N",
                        endotracheal: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.04') ? "Y" : "N",
                        IGD: igd ? "Y" : "N",
                        FISIO: fisio ? "Y" : "N",
                        HEMO: hemo ? "Y" : "N",
                        VENTI: venti ? "Y" : "N",
                        BEDAH: bedah ? "Y" : "N",
                        Jasa_sarana: bagi_rs.Jasa_sarana,
                        Jasa_pelayanan: bagi_rs.Jasa_pelayanan,
                        formasi_bangsal: duit_formasi.bangsal,
                        bcu: bagi_penujang.bcu,
                        struktural: bagi_penujang.BJP_strutural,
                        lab: bagi_penujang.lab,
                        mikro: bagi_penujang.mkro,
                        farmasi: bagi_penujang.farmasi,
                        radiologi: bagi_penujang.radiologi,
                        drIGD: bagi_penujang.drIGD,
                        fisio: bagi_penujang.fisio,
                        hemo: bagi_penujang.hemo,
                        dikurangi: bagi_penujang.sisa,
                        dr_DPJP_48: bagi_medis.dr_DPJP_48,
                        pr_31: bagi_medis.pr_31,
                        pr_ruangan: bagi_medis.pr_ruangan,
                        karu: bagi_medis.karu,
                        pr_igd: bagi_medis.pr_igd,
                        managemnt_21: bagi_medis.mm_21,
                        formasi_bedah: duit_formasi.bedah,
                        dpjp_oka_60: duit_oka.dpjp_OK,
                        dr_operator_OK: duit_oka.dr_operator_OK,
                        pr_operator_OK: duit_oka.pr_operator_OK,
                        cssd: duit_oka.cssd,
                        anestesi_40: duit_oka.anestsi_OK,
                        dr_anestesi_OK: duit_oka.dr_anestesi,
                        pr_anestesi_OK: duit_oka.pr_anestesi,
                        formasi_venti: duit_formasi.venti,
                        dr_anestesi: duit_ventilator.dr_anestesi,
                        pr_venti: duit_ventilator.pr_ventilator,
                        dr_ventilator: duit_ventilator.dr_ventilator
                    }
                    dataRanap.push(dataKlaim);
                }
                fs.writeFile('./cache/' + filename, JSON.stringify(dataRanap), (err, dataRalan) => {
                    if (err) {
                        console.log("File read failed:", err);
                        return;
                    }
                    // console.log("File data:", dataRanap);
                });
                return res.status(200).json({
                    status: true,
                    message: 'Data klaim Ranap',
                    url: fullUrl + filename,
                    record: klaim.length,
                    data: dataRanap,
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Data klaim Ranap',
                url: fullUrl + token + '.json',
                record: token,
                klaim
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: 'error',
                data: error.message
            });
        }
    }
}
'use strict';
const { reg_periksa, pasien, dokter, poliklinik, jadwal, pegawai, pemeriksaan_ralan, bridging_sep, dpjp_ranap, operasi, paket_operasi, bangsal, kamar, kamar_inap, maping_dokter_dpjpvclaim, maping_poli_bpjs, rujukan_internal_poli } = require('../models');
const axios = require('axios');
const { Op } = require("sequelize");
const fs = require('fs');
const sha256 = require('js-sha256');
const url_bpjs = process.env.URL_BPJS
const {
    BPJS_Setujui,
    formasi,
    penujang,
    medis,
    OKA,
    ventilator,
    findProlist,
    penujangRajal,
    tindakanPerawat,
    parsingBangsal,
    parsingBangsalPending,
    parsingDPJP,
    groupData,
    rawRalan,
    rawRanap,
    fomulaRemon,
    fomulaRaber,
    formasiBedah,
    formasiVenti
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
                const getData = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=' + param.status);
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
                                tarifbySetujui: parseInt(element.biaya.bySetujui),
                                pesertaNama: element.peserta.nama,
                                pesertaNoMr: element.peserta.noMr,
                                peserta_tglLahir: element.dataSEP.peserta.tglLahir,
                                pesertaNoBPJS: element.dataSEP.peserta.noKartu,
                                pesertahakKelas: element.peserta.hakKelas,
                                inacbg_kode: element.Inacbg.kode,
                                inacbg_nama: element.Inacbg.nama,
                                diagnosa_sep: element.dataSEP.diagnosa,
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
                                peserta_tglLahir: dataSEP.tanggal_lahir,
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
                const fileContent = fs.readFileSync('controllers/inacbg/' + param.dataINACBG, 'utf-8');
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
                    let bagi_penujang = penujang(duit_formasi.bangsal, igd, fisio, hemo, bedah, duit_karu);
                    let bagi_medis = medis(bagi_penujang.sisa);
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
                        Bangsal1: lastKamar[0].kode_kamar.bangsal.nm_bangsal,
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
                        tracheostomy: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.05') ? "Y" : "N",
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
                        anestesi_35: duit_oka.anestsi_OK,
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
    },
    getJasaDrRanap: async (req, res) => {
        try {
            let param = req.query;
            let token = JSON.stringify(param)
            token = sha256(token);
            const protocol = req.protocol;
            const host = req.hostname;
            const port = process.env.PORT || 3000;
            const fullUrl = `${protocol}://${host}:${port}/api/cache/`
            let klaim = [];
            let getData = await req.cache.json.get(`data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}`, '$');
            if (getData == null) {
                getData = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=' + param.status);
                getData = getData.data.response.data;
                req.cache.json.set(`data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}`, '$', getData);
                req.cache.expire(`data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}`, 60 * 60);
            }
            klaim = getData;

            let filterFPK = param.filterFPK.split(',');
            for (let noFPK of filterFPK) {
                klaim = klaim.filter(item => item.noFPK !== noFPK);
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
                let dataSEP = klaim.map(item => item.noSEP);

                // let sepSIMRS = await req.cache.json.get(`data:monitoring:klaim:${param.from}:${param.until}:SEP`, '$');
                let sepSIMRS = null;
                if (sepSIMRS == null) {
                    sepSIMRS = await bridging_sep.findAll({
                        where: {
                            no_sep: dataSEP,
                            jnspelayanan: '2',
                        },
                        include: [{
                            model: maping_dokter_dpjpvclaim,
                            as: 'maping_dokter_dpjpvclaim',
                            attributes: ['nm_dokter_bpjs', 'kd_dokter_bpjs'],
                        }],
                        attributes: ['no_rawat', 'no_sep', 'nomr', 'tanggal_lahir', 'nmdiagnosaawal', 'nmdpdjp', 'kddpjp', 'kdpolitujuan', 'nmpolitujuan'],
                    })
                    // sepSIMRS.forEach(obj => {
                    //     obj.nmdpdjp = obj.maping_dokter_dpjpvclaim.nm_dokter_bpjs; // Update name property
                    //     delete obj.maping_dokter_dpjpvclaim; // Remove newName property

                    // // });
                    for (const element of sepSIMRS) {

                        if (element.maping_dokter_dpjpvclaim != null) {
                            element.nmdpdjp = element.maping_dokter_dpjpvclaim.nm_dokter_bpjs;
                            delete element.maping_dokter_dpjpvclaim;
                        }
                    }
                    // req.cache.json.set(`data:monitoring:klaim:${param.from}:${param.until}:SEP`, '$', sepSIMRS);
                    // req.cache.expire(`data:monitoring:klaim:${param.from}:${param.until}:SEP`, 60 * 60);
                }

                let dataSEPSIMRS = sepSIMRS.map(item => item.no_sep);

                if (klaim.length != sepSIMRS.length) {
                    let tidakDitemukan = klaim.filter(item => !dataSEPSIMRS.includes(item.noSEP));
                    let dataNorm = tidakDitemukan.map(item => item.peserta.noMR);
                    let tglReg = tidakDitemukan.map(item => item.tglSep);
                    // let dataReg = await req.cache.json.get(`data:monitoring:klaim:${param.from}:${param.until}:dataReg`, '$');
                    let dataReg = null;
                    if (dataReg == null) {
                        dataReg = await reg_periksa.findAll({
                            where: {
                                no_rkm_medis: dataNorm,
                                tgl_registrasi: tglReg,
                            },
                            include: [{
                                model: pasien,
                                as: 'pasien',
                                attributes: ['nm_pasien', 'tgl_lahir', 'no_peserta'],
                            }, {
                                model: maping_dokter_dpjpvclaim,
                                as: 'maping_dokter_dpjpvclaim',
                                attributes: ['nm_dokter_bpjs', 'kd_dokter_bpjs'],
                            }, {
                                model: maping_poli_bpjs,
                                as: 'maping_poli_bpjs',
                                attributes: ['nm_poli_bpjs', 'kd_poli_bpjs']
                            }],
                            attributes: ['no_rawat', 'tgl_registrasi', 'no_rkm_medis', 'kd_poli', 'kd_dokter'],
                        });
                    }

                    let dataKlaim = [];
                    for (const element of tidakDitemukan) {
                        try {
                        let data = {
                            no_rawat: dataReg.find(item => item.pasien.no_peserta == element.peserta.noKartu).no_rawat,
                            no_sep: element.noSEP,
                            nomr: element.peserta.noMr,
                            tanggal_lahir: dataReg.find(item => item.pasien.no_peserta == element.peserta.noKartu).pasien.tgl_lahir,
                            nmdiagnosaawal: element.diagnosa,
                            nmdpdjp: dataReg.find(item => item.pasien.no_peserta == element.peserta.noKartu).maping_dokter_dpjpvclaim.nm_dokter_bpjs,
                            kddpjp: dataReg.find(item => item.pasien.no_peserta == element.peserta.noKartu).maping_dokter_dpjpvclaim.kd_dokter_bpjs,
                            kdpolitujuan: dataReg.find(item => item.pasien.no_peserta == element.peserta.noKartu).maping_poli_bpjs.kd_poli_bpjs,
                            nmpolitujuan: dataReg.find(item => item.pasien.no_peserta == element.peserta.noKartu).maping_poli_bpjs.nm_poli_bpjs,
                        }
                        dataKlaim.push(data);
                        } catch (err) {
                            console.log(element.peserta.noKartu);
                            console.log(err);
                        }
                    }
                    sepSIMRS = sepSIMRS.concat(dataKlaim);
                }
                let dataRegSIMRS = sepSIMRS.map(item => item.no_rawat);
                let raber = await req.cache.json.get(`data:monitoring:klaim:${param.from}:${param.until}:raber`, '$');
                if (raber == null) {
                    raber = await rujukan_internal_poli.findAll({
                        where: {
                            no_rawat: dataRegSIMRS,
                        },
                        include: [{
                            model: maping_dokter_dpjpvclaim,
                            as: 'maping_dokter_dpjpvclaim',
                            attributes: ['nm_dokter_bpjs', 'kd_dokter_bpjs'],
                        }, {
                            model: maping_poli_bpjs,
                            as: 'maping_poli_bpjs',
                            attributes: ['nm_poli_bpjs', 'kd_poli_bpjs']
                        }],
                    });
                    req.cache.json.set(`data:monitoring:klaim:${param.from}:${param.until}:raber`, '$', raber);
                    req.cache.expire(`data:monitoring:klaim:${param.from}:${param.until}:raber`, 60 * 60);
                }

                // tambahkan nomor sep di let raber
                let dataRaber = [];

                for (const element of raber) {
                    let data = {
                        ...element,
                        no_sep: sepSIMRS.find(item => item.no_rawat == element.no_rawat).no_sep,
                    }
                    dataRaber.push(data);
                }
                let arrayno_sep = dataRaber.map(item => item.no_sep);

                let cekSEPduplikat = groupData(arrayno_sep).duplicatesWithCount;

                let RawData = [];
                let RawDataRaber = [];
                for (const element of klaim) {
                    let totaltarif = parseInt(element.biaya.bySetujui);
                    let bagi_rs = BPJS_Setujui(totaltarif);
                    let data_penujangRajal = penujangRajal(bagi_rs.Jasa_pelayanan);
                    let dataSEPnow = sepSIMRS.find(item => item.no_sep == element.noSEP).no_sep;
                    let noRawat = sepSIMRS.find(item => item.no_sep == element.noSEP).no_rawat;
                    // get jumlah data nm_dokter_bpjs from raber by no_rawat
                    let jumlahDPJP = cekSEPduplikat.find(item => item.value == dataSEPnow);
                    let raberDPJP = '';
                    let raberPoli = '';
                    let jasaDPJP = 0;
                    if (jumlahDPJP) {
                        let DPJP = raber.filter(item => item.no_rawat == noRawat);
                        let jasaDPJPPenujang = 0;
                        if (jumlahDPJP.count == 1) {
                            jasaDPJPPenujang = Math.round(data_penujangRajal.dokter_48 * 40 / 100);
                        }
                        if (jumlahDPJP.count > 1) {
                            jasaDPJPPenujang = Math.round(data_penujangRajal.dokter_48 / (jumlahDPJP.count + 1));
                        }
                        for (let i = 0; i < DPJP.length; i++) {
                            try {
                            if (i == 0) {
                                raberDPJP += DPJP[i].maping_dokter_dpjpvclaim.nm_dokter_bpjs;
                                raberPoli += DPJP[i].maping_poli_bpjs.nm_poli_bpjs;
                            } else {
                                raberDPJP += ', ' + DPJP[i].maping_dokter_dpjpvclaim.nm_dokter_bpjs;
                                raberPoli += ', ' + DPJP[i].maping_poli_bpjs.nm_poli_bpjs;
                            }



                                let dataDpjpRaber = {
                                    noFPK: element.noFPK,
                                    tglSep: element.tglSep,
                                    noSEP: element.noSEP,
                                    kelasRawat: element.kelasRawat,
                                    nama_pasien: element.peserta.nama,
                                    noRM: element.peserta.noMr,
                                    noBPJS: element.peserta.noKartu,
                                    tglLahir: sepSIMRS.find(item => item.no_sep == element.noSEP).tanggal_lahir,
                                    pesertahakKelas: element.peserta.hakKelas,
                                    diagnosa: sepSIMRS.find(item => item.no_sep == element.noSEP).nmdiagnosaawal,
                                    inacbg_kode: element.Inacbg.kode,
                                    inacbg_nama: element.Inacbg.nama,
                                    "poli asal": element.poli,
                                    "poli Raber": DPJP[i].maping_poli_bpjs.nm_poli_bpjs,
                                    "dr penunjang": DPJP[i].maping_dokter_dpjpvclaim.nm_dokter_bpjs,
                                    tarifbySetujuiBPJS: parseInt(element.biaya.bySetujui),
                                    tarifbyTarifRS: parseInt(element.biaya.byTarifRS),
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
                                    "poli tambahan": jumlahDPJP ? jumlahDPJP.count : 0,
                                    "jasa DPJP": jasaDPJPPenujang,
                                    perawat_31: data_penujangRajal.perawat_31,
                                    managemnt_21: data_penujangRajal.managemnt_21,
                                }
                                RawDataRaber.push(dataDpjpRaber);
                            } catch (error) {
                                console.log(error);
                                console.log(DPJP[i]);
                            }
                            // RawDataRaber.push(dataDpjpRaber);
                        }
                        if (jumlahDPJP.count == 1) {
                            jasaDPJP = Math.round(data_penujangRajal.dokter_48 * 60 / 100);
                        }
                        if (jumlahDPJP.count > 1) {
                            jasaDPJP = Math.round(data_penujangRajal.dokter_48 / (jumlahDPJP.count + 1));
                        }
                    } else {
                        jasaDPJP = data_penujangRajal.dokter_48;
                    }

                    let dataKlaim = {
                        noFPK: element.noFPK,
                        tglSep: element.tglSep,
                        noSEP: element.noSEP,
                        kelasRawat: element.kelasRawat,
                        nama_pasien: element.peserta.nama,
                        noRM: element.peserta.noMr,
                        noBPJS: element.peserta.noKartu,
                        tglLahir: sepSIMRS.find(item => item.no_sep == element.noSEP).tanggal_lahir,
                        pesertahakKelas: element.peserta.hakKelas,
                        diagnosa: sepSIMRS.find(item => item.no_sep == element.noSEP).nmdiagnosaawal,
                        inacbg_kode: element.Inacbg.kode,
                        inacbg_nama: element.Inacbg.nama,
                        dpjp: sepSIMRS.find(item => item.no_sep == element.noSEP).nmdpdjp,
                        "poli asal": sepSIMRS.find(item => item.no_sep == element.noSEP).nmpolitujuan,
                        "dr penunjang": raberDPJP,
                        "poli Raber": raberPoli,
                        tarifbySetujuiBPJS: parseInt(element.biaya.bySetujui),
                        tarifbyTarifRS: parseInt(element.biaya.byTarifRS),
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
                        "poli tambahan": jumlahDPJP ? jumlahDPJP.count : 0,
                        "jasa DPJP": jasaDPJP,
                        perawat_31: data_penujangRajal.perawat_31,
                        managemnt_21: data_penujangRajal.managemnt_21,
                    }
                    RawData.push(dataKlaim);
                }
                let byTarifRS = klaim.map(item => parseInt(item.biaya.byTarifRS));
                let bySetujui = klaim.map(item => parseInt(item.biaya.bySetujui));
                let groupFPK = groupData(RawData.map(item => item.noFPK)).duplicatesWithCount;
                let groupdataFPK = [];
                for (const element of groupFPK) {
                    let data = {
                        noFPK: element.value,
                        bySetujui: RawData.filter(item => item.noFPK == element.value).map(item => parseInt(item.tarifbySetujuiBPJS)).reduce((a, b) => a + b, 0),
                        byTarifRS: RawData.filter(item => item.noFPK == element.value).map(item => parseInt(item.tarifbyTarifRS)).reduce((a, b) => a + b, 0),
                        count: element.count
                    }
                    groupdataFPK.push(data);
                }


                fs.writeFileSync('./cache/' + "rawJasaRalan.json", JSON.stringify({
                    "FPK": groupdataFPK,
                    "RAW UTAMA": RawData,
                    "Raw Raber": RawDataRaber
                }));
                fs.writeFileSync('./cache/' + "rawJasaRalanRaber.json", JSON.stringify(RawDataRaber));


                return res.status(200).json({
                    status: true,
                    message: 'Data klaim',
                    record: klaim.length,
                    sepSIMRS: sepSIMRS.length,
                    bySetujui: bySetujui.reduce((a, b) => a + b, 0),
                    byTarifRS: byTarifRS.reduce((a, b) => a + b, 0),
                    dataRabers: {
                        record: raber.length,
                        dataRaber: dataRaber,
                    }
                });
            }

            if (param.pelayanan == 1) {
                let dataSEP_FPK = klaim.map(item => item.noSEP);
                let dataSEP_SIMRS = await bridging_sep.findAll({
                    where: {
                        no_sep: dataSEP_FPK,
                        jnspelayanan: '1'
                    },
                    attributes: ['no_rawat', 'nomr', 'no_sep', 'nmdiagnosaawal', 'kddpjp', 'nmdpdjp'],
                });

                if (dataSEP_FPK.length != dataSEP_SIMRS.length) {
                    let dataSEP_backdate = dataSEP_FPK.filter(item => !dataSEP_SIMRS.find(x => x.no_sep === item));
                    let dataSEP_briging = [];
                    for (const element of dataSEP_backdate) {
                        let getDataSEP = await axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + element);
                        dataSEP_briging.push(getDataSEP.data.response);
                    }
                    let dataRM = dataSEP_briging.map(item => item.peserta.noMr)
                    let tglRawat = dataSEP_briging.map(item => item.tglSep)
                    let reg_maksuk = await reg_periksa.findAll({
                        where: {
                            tgl_registrasi: tglRawat,
                            no_rkm_medis: dataRM
                        },
                        attributes: ['no_rawat', 'tgl_registrasi', 'no_rkm_medis']
                    });
                    for (const element of dataSEP_briging) {
                        element.no_rawat = reg_maksuk.find(item => item.no_rkm_medis === element.peserta.noMr).no_rawat;

                    }

                    let noRegSEP_SIMRS = dataSEP_SIMRS.map(item => item.no_rawat);
                    let noRegSEP_briging = dataSEP_briging.map(item => item.no_rawat);
                    noRegSEP_SIMRS = noRegSEP_SIMRS.concat(noRegSEP_briging);
                    let reg_masuk_poli = await reg_periksa.findAll({
                        where: {
                            no_rawat: noRegSEP_SIMRS,
                        },
                        include: [{
                            model: poliklinik,
                            as: 'poliklinik',
                            attributes: ['nm_poli']
                        }],
                        attributes: ['no_rawat', 'tgl_registrasi', 'no_rkm_medis', 'kd_poli'],
                    });
                    for (const element of dataSEP_briging) {

                        element.poliklinik = reg_masuk_poli.find(item => item.no_rawat === element.no_rawat).poliklinik.nm_poli;



                    }
                    for (const element of dataSEP_SIMRS) {

                        element.dataValues.poliklinik = reg_masuk_poli.find(item => item.no_rawat === element.no_rawat).poliklinik.nm_poli;

                    }
                    let lastKamars = await kamar_inap.findAll({
                        where: {
                            no_rawat: noRegSEP_SIMRS,
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
                        attributes: ['no_rawat', 'kd_kamar', 'tgl_masuk', 'tgl_keluar', 'stts_pulang', 'lama'],
                    });


                    const fileContent = fs.readFileSync('controllers/inacbg/' + param.dataINACBG, 'utf-8');
                    let inacbg = JSON.parse(fileContent);
                    let dataRanap = [];
                    let datanoFPK = [];
                    let lostSEP = [];
                    let js_pr = {
                        "Bangsal Anak": [],
                        "Bangsal Bedah": [],
                        "Bangsal Isolasi Utama": [],
                        "Bangsal ICU": [],
                        "Bangsal Kelas 1 B": [],
                        "Bangsal Kelas 1 C": [],
                        "Bangsal Nifas": [],
                        "Bangsal Penyakit Dalam": [],
                        "Bangsal Perinatologi": [],
                        "Bangsal Saraf": [],
                        "Bangsal VIP": [],
                        "Bangsal VK": [],
                        "Bangsal VK Bayi Sehat": [],
                        "Transit IGD": [],
                    };


                    let js_dpjp = {
                        AGUSTINUS: [],
                        ALFONS: [],
                        "ARI ": [],
                        BORIS: [],
                        DAVIS: [],
                        DIANA: [],
                        DJOKO: [],
                        ESTU: [],
                        FENNY: [],
                        FREDDY: [],
                        HANARTO: [],
                        HARTONO: [],
                        HERLING: [],
                        HERISA: [],
                        MARKUS: [],
                        MARSITA: [],
                        MUDIB: [],
                        MUSLIM: [],
                        MARIA: [],
                        NOVI: [],
                        RAHMAD: [],
                        RACHIM: [],
                        RADHITIO: [],
                        SONNY: [],
                        STEVIE: [],
                        TEGUH: [],
                        TOGU: [],
                        UNDARI: [],
                        YESS: [],
                        VIVI: [],
                        YUNITA: [],
                        ZAINUL: []
                    };

                    for (const element of klaim) {

                        if (dataSEP_SIMRS.find(obj => obj.no_sep === element.noSEP) == undefined) {
                            element.dataSEP_SIMRS = dataSEP_briging.find(obj => obj.noSep === element.noSEP);
                        } else {
                            element.dataSEP_SIMRS = dataSEP_SIMRS.find(obj => obj.no_sep === element.noSEP);
                        }
                        if (inacbg.find(obj => obj.SEP === element.noSEP) != undefined) {

                            let prolis = inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST;
                            let DIAGLIST = inacbg.find(obj => obj.SEP === element.noSEP).DIAGLIST;
                            let poli
                            if (element.dataSEP_SIMRS.poliklinik == undefined) {
                                poli = element.dataSEP_SIMRS.dataValues.poliklinik;
                            } else {
                                poli = element.dataSEP_SIMRS.poliklinik
                            }
                            let igd = (poli == 'IGD') ? true : false;
                            console.log(igd);
                            let hemo = (findProlist(prolis, '39.95') || findProlist(prolis, '38.93') || findProlist(prolis, '38.95')) ? true : false;
                            let venti = (findProlist(prolis, '96.72') || findProlist(prolis, '96.71')) ? true : false;
                            let bedah = inacbg.find(obj => obj.SEP === element.noSEP).PROSEDUR_BEDAH > 0 ? true : false;
                            let bagi_rs = BPJS_Setujui(parseInt(element.biaya.bySetujui));
                            let duit_formasi = formasi(bagi_rs.Jasa_pelayanan, venti, bedah);
                            let bagi_penujang = penujang(duit_formasi.bangsal, igd, bedah);
                            let bagi_tindakanPerawat = tindakanPerawat(bagi_penujang.tindakan2persen, prolis)
                            let sisa2 = Math.round(bagi_penujang.tindakan2persen - bagi_tindakanPerawat.tindakan_usg - bagi_tindakanPerawat.fisioterapi - bagi_tindakanPerawat.EKG - bagi_tindakanPerawat.GDS - bagi_tindakanPerawat.USG);
                            let bagi_medis = medis(bagi_penujang.sisa, hemo);
                            let duit_oka = OKA(duit_formasi.bedah);
                            let duit_ventilator = ventilator(duit_formasi.venti);
                            let lastKamar = lastKamars.filter(obj => obj.no_rawat === element.dataSEP_SIMRS.no_rawat);
                            console.log(element.dataSEP_SIMRS.no_rawat);
                            let lamaInapB1 = lastKamar[0] ? lastKamar[0].lama : 0;
                            let lamaInapB2 = lastKamar[1] ? lastKamar[1].lama : 0;
                            let lamaInapB3 = lastKamar[2] ? lastKamar[2].lama : 0;
                            let lamaInapB4 = lastKamar[3] ? lastKamar[3].lama : 0;
                            let lamaInap = lamaInapB1 + lamaInapB2 + lamaInapB3 + lamaInapB4;
                            let js_pr_inapB1 = Math.round(lamaInapB1 / lamaInap * bagi_medis.pr_ruangan);
                            let js_pr_inapB2 = Math.round(lamaInapB2 / lamaInap * bagi_medis.pr_ruangan);
                            let js_pr_inapB3 = Math.round(lamaInapB3 / lamaInap * bagi_medis.pr_ruangan);
                            let js_pr_inapB4 = Math.round(lamaInapB4 / lamaInap * bagi_medis.pr_ruangan);
                            let dpjp_ranap_bpj = '';
                            if (element.dataSEP_SIMRS.nmdpdjp == undefined) {
                                dpjp_ranap_bpj = element.dataSEP_SIMRS.kontrol.nmDokter
                            } else {
                                dpjp_ranap_bpj = element.dataSEP_SIMRS.nmdpdjp
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
                                LOS: inacbg.find(obj => obj.SEP === element.noSEP).LOS,
                                ICU_INDIKATOR: inacbg.find(obj => obj.SEP === element.noSEP).ICU_INDIKATOR,
                                ICU_LOS: inacbg.find(obj => obj.SEP === element.noSEP).ICU_LOS,
                                VENT_HOUR: inacbg.find(obj => obj.SEP === element.noSEP).VENT_HOUR,
                                jalurMasuk: poli,
                                Kamar1: lastKamar[0].kd_kamar + ' - stts_pulang: ' + lastKamar[0].stts_pulang + ' - ' + lastKamar[0].lama + ' hari',
                                Bangsal1: lastKamar[0].kode_kamar.bangsal.nm_bangsal,
                                js_pr_inapB1: js_pr_inapB1,
                                Kamar2: lastKamar[1] ? lastKamar[1].kd_kamar + ' - stts_pulang: ' + lastKamar[1].stts_pulang + ' - ' + lastKamar[1].lama + ' hari' : '-',
                                Bangsal2: lastKamar[1] ? lastKamar[1].kode_kamar.bangsal.nm_bangsal : '-',
                                js_pr_inapB2: js_pr_inapB2,
                                Kamar3: lastKamar[2] ? lastKamar[2].kd_kamar + ' - stts_pulang: ' + lastKamar[2].stts_pulang + ' - ' + lastKamar[2].lama + ' hari' : '-',
                                Bangsal3: lastKamar[2] ? lastKamar[2].kode_kamar.bangsal.nm_bangsal : '-',
                                js_pr_inapB3: js_pr_inapB3,
                                Kamar4: lastKamar[3] ? lastKamar[3].kd_kamar + ' - stts_pulang: ' + lastKamar[3].stts_pulang + ' - ' + lastKamar[3].lama + ' hari' : '-',
                                Bangsal4: lastKamar[3] ? lastKamar[3].kode_kamar.bangsal.nm_bangsal : '-',
                                js_pr_inapB4: js_pr_inapB4,
                                DESKRIPSI_INACBG: inacbg.find(obj => obj.SEP === element.noSEP).DESKRIPSI_INACBG,
                                DIAGLIST: String(DIAGLIST),
                                PROCLIST: String(prolis),
                                DPJP_INACBG: inacbg.find(obj => obj.SEP === element.noSEP).DPJP,
                                dpjp_ranap_bpj: dpjp_ranap_bpj,
                                dpjp_ranap_RS1: '-',
                                dpjp_ranap_RS2: '-',
                                dpjp_ranap_RS3: '-',
                                dpjp_ranap_RS4: '-',
                                ventilation_more96: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.72') ? "Y" : "N",
                                ventilation_less96: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.71') ? "Y" : "N",
                                endotracheal_intubasi: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '96.04') ? "Y" : "N",
                                IGD: igd ? "Y" : "N",
                                VENTI: venti ? "Y" : "N",
                                BEDAH: bedah ? "Y" : "N",
                                CVC: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '38.93') ? "Y" : "N",
                                CDL: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '38.95') ? "Y" : "N",
                                Bronkoskopi: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '33.23') ? "Y" : "N",
                                EEG: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '89.14') ? "Y" : "N",
                                CTG: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '75.32') ? "Y" : "N",
                                Biopsi: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '45.15') ? "Y" : "N",
                                "spinal canal": findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '03.92') ? "Y" : "N",
                                curettage: findProlist(inacbg.find(obj => obj.SEP === element.noSEP).PROCLIST, '69.09') ? "Y" : "N",
                                tindakan_usg: bagi_tindakanPerawat.tindakan_usg,
                                Jasa_sarana: bagi_rs.Jasa_sarana,
                                Jasa_pelayanan: bagi_rs.Jasa_pelayanan,
                                formasi_bangsal: duit_formasi.bangsal,
                                bcu: bagi_penujang.bcu,
                                "tindakan2%": bagi_penujang.tindakan2persen,
                                fisio: bagi_tindakanPerawat.fisioterapi,
                                ekg: Math.round(bagi_tindakanPerawat.EKG),
                                gds: Math.round(bagi_tindakanPerawat.GDS),
                                usg: Math.round(bagi_tindakanPerawat.USG),
                                "sisa2%": sisa2,
                                struktural: bagi_penujang.BJP_strutural,
                                lab: bagi_penujang.lab,
                                mikro: bagi_penujang.mkro,
                                farmasi: bagi_penujang.farmasi,
                                radiologi: bagi_penujang.radiologi,
                                drIGD: bagi_penujang.drIGD,
                                pr_igd: bagi_penujang.pr_igd,
                                dikurangi: bagi_penujang.sisa,
                                dr_DPJP_48: bagi_medis.dr_DPJP_48,
                                pr_31: bagi_medis.pr_31,
                                pr_ruangan: bagi_medis.pr_ruangan,
                                hemo: bagi_medis.hemodialisa,
                                managemnt_21: bagi_medis.mm_21,
                                formasi_bedah: duit_formasi.bedah,
                                dpjp_oka_60: duit_oka.dpjp_OK,
                                dr_operator_OK: duit_oka.dr_operator_OK,
                                pr_operator_OK: duit_oka.pr_operator_OK,
                                cssd: duit_oka.cssd,
                                anestesi_35: duit_oka.anestsi_OK,
                                dr_anestesi_OK: duit_oka.dr_anestesi,
                                formasi_venti: duit_formasi.venti,
                                dr_anestesi_venti: duit_ventilator.dr_anestesi,
                                pr_venti: duit_ventilator.pr_ventilator,
                                dr_ventilator: duit_ventilator.dr_ventilator
                            }
                            dataRanap.push(dataKlaim);
                            if (datanoFPK.find(obj => obj.noFPK === element.noFPK)) {
                                let foundObject = datanoFPK.find(obj => obj.noFPK === element.noFPK)
                                if (foundObject) {
                                    foundObject.byTarifRS += parseInt(element.biaya.byTarifRS);
                                    foundObject.bySetujui += parseInt(element.biaya.bySetujui);
                                    foundObject.count++
                                }
                            } else {
                                let newObj = { noFPK: element.noFPK, bySetujui: parseInt(element.biaya.bySetujui), byTarifRS: parseInt(element.biaya.byTarifRS), count: 1 };
                                datanoFPK.push(newObj)

                            }
                            for (let key in js_pr) {
                                let js = parsingBangsal(dataKlaim, key);
                                if (js !== null) {
                                    js_pr[key].push(js);
                                }
                            }


                            for (let key in js_dpjp) {
                                let js = parsingDPJP(dataKlaim, key, js_dpjp);
                                if (js !== null) {
                                    js_dpjp[key].push(js);
                                }
                            }
                        } else {
                            // console.log(element.noSEP);
                            lostSEP.push(element.noSEP);
                        }
                    }
                    try {
                        let filename = 'Ranap_' + token + '.json'
                        for (let key in js_pr) {
                            fs.writeFileSync('./cache/bangsal/' + key + ".json", JSON.stringify(js_pr[key]));
                        }
                        for (let key in js_dpjp) {
                            fs.writeFileSync('./cache/dpjp/' + key + ".json", JSON.stringify(js_dpjp[key]));
                        }
                        fs.writeFileSync('./cache/' + "bangsal" + param.nameType + ".json", JSON.stringify(js_pr));
                        fs.writeFileSync('./cache/' + "dpjp" + param.nameType + ".json", JSON.stringify(js_dpjp));
                        fs.writeFileSync('./cache/' + "raw" + param.nameType + ".json", JSON.stringify({ repot: datanoFPK, raw: dataRanap }));
                        fs.writeFileSync('./cache/' + "repot" + param.nameType + ".json", JSON.stringify(datanoFPK));
                        fs.writeFileSync('./cache/' + filename, JSON.stringify(dataRanap));
                        fs.writeFile('./cache/' + filename, JSON.stringify(dataRanap), (err, dataRalan) => {
                            if (err) {
                                console.log("File read failed:", err);
                                return;
                            }
                        });
                    } catch (error) {
                        return res.status(500).json({
                            status: false,
                            message: 'error',
                            data: error.message
                        });
                    }

                    return res.status(200).json({
                        status: false,
                        message: 'suskes',
                        record: {
                            dataSEP_briging: dataSEP_briging.length,
                            FPK: dataSEP_FPK.length,
                            dataSEP_SIMRS: dataSEP_SIMRS.length,
                            noRegSEP_SIMRS: noRegSEP_SIMRS.length,
                            lostSEP: lostSEP.length
                        },
                    });
                }
                // let dataSEP_backdate = dataSEP_FPK.filter(item => !dataSEP_SIMRS.find(x => x.no_sep === item));
                // let grupTGLSEP = groupData(klaim.map(item => item.tglSep)).uniqueValues;
                // let grupNoRms = groupData(klaim.map(item => item.peserta.noMR)).uniqueValues;
                // if (dataSEP_FPK.length != dataSEP_SIMRS.length) {

                // }

                return res.status(200).json({
                    status: true,
                    message: 'Data klaim Ranap',
                    // url: fullUrl + token + '.json',
                    record: {
                        dataSEP_FPK: dataSEP_FPK.length,
                        grupTGLSEP: grupNoRms,
                    },

                });

            }
            return res.status(200).json({
                status: true,
                message: 'Data klaim Ranap',
                // url: fullUrl + token + '.json',
                record: {},
                // dataSEP_FPK
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: 'error',
                data: error.message
            });
        }
    },
    RAW: async (req, res) => {
        try {
            let param = req.query;
            if (param.pelayanan == 1) {
                const fileContent = fs.readFileSync('controllers/inacbg/' + param.dataINACBG, 'utf-8');
                let inacbg = JSON.parse(fileContent);
                let dataRanap = [];
                let js_dpjp = {
                    AGUSTINUS: [],
                    ALFONS: [],
                    "ARI ": [],
                    BORIS: [],
                    DAVIS: [],
                    DIANA: [],
                    DJOKO: [],
                    ESTU: [],
                    FENNY: [],
                    FREDDY: [],
                    HANARTO: [],
                    HARTONO: [],
                    HERLING: [],
                    HERISA: [],
                    MARKUS: [],
                    MARSITA: [],
                    MUDIB: [],
                    MUSLIM: [],
                    MARIA: [],
                    NOVI: [],
                    RAHMAD: [],
                    RACHIM: [],
                    RADHITIO: [],
                    SONNY: [],
                    STEVIE: [],
                    TEGUH: [],
                    TOGU: [],
                    UNDARI: [],
                    VIVI: [],
                    YUNITA: [],
                    YESSIKA: [],
                    ZAINUL: [],
                    RANTAPINA: [],
                    RUCHA: [],
                    SULISTYO: [],
                };
                for (const e of inacbg) {
                    let getDataSEP = await req.cache.json.get(`data:SEP:klaim:${param.pelayanan}:${e.noSEP}`, '$');
                    if (getDataSEP == null) {

                        getDataSEP = await axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + e.SEP);
                        // getDataSEP = getDataSEP.;
                        getDataSEP = getDataSEP.data.response;
                        req.cache.json.set(`data:SEP:klaim:${param.pelayanan}:${e.noSEP}`, '$', getDataSEP);
                        req.cache.expire(`data:SEP:klaim:${param.pelayanan}:${e.noSEP}`, 1200);
                    }

                    let dataKlaim = rawRanap(e, getDataSEP);
                    dataRanap.push(dataKlaim);
                    for (let key in js_dpjp) {
                        let js = parsingDPJP(dataKlaim, key, js_dpjp);
                        if (js !== null) {
                            js_dpjp[key].push(js);
                        }
                    }
                }

                fs.writeFileSync('./cache/' + "dpjp" + param.nameType + ".json", JSON.stringify(js_dpjp));
                fs.writeFileSync('./cache/' + "raw" + param.nameType + ".json", JSON.stringify({ raw: dataRanap }));


                return res.status(200).json({
                    status: false,
                    message: 'Ranap',
                    data: dataRanap
                });
            }
            if (param.pelayanan == 2) {
                let getDataSEP = await req.cache.json.get(`data:monitoring:klaim:${param.from}-${param.until}:${param.pelayanan}`, '$');
                if (getDataSEP == null) {
                    let x = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=2&status=3');
                    getDataSEP = x.data.response.data;
                    req.cache.json.set(`data:monitoring:klaim:${param.from}-${param.until}:${param.pelayanan}`, '$', x.data.response.data);
                    req.cache.expire(`data:monitoring:klaim:${param.from}-${param.until}:${param.pelayanan}`, 60 * 60 * 24);
                }
                let dataRAW = [];
                let zx = 0;
                let zz = 0;
                let er = 0;
                for (let e of getDataSEP) {
                    let cariSEP = await req.cache.json.get(`data:SEP:klaim:${param.pelayanan}:${e.noSEP}`, '$');
                    if (cariSEP == null) {
                        axios.get(url_bpjs + '/api/bpjs/sep?noSEP=' + e.noSEP).then((x) => {
                            cariSEP = x.data.response;
                            req.cache.json.set(`data:SEP:klaim:${param.pelayanan}:${e.noSEP}`, '$', x.data.response);
                            req.cache.expire(`data:SEP:klaim:${param.pelayanan}:${e.noSEP}`, 1200);
                            let data = rawRalan(e, cariSEP);
                            dataRAW.push(data);
                        }).catch((err) => {
                            console.log(err);
                            er++;
                            return;
                        });
                        zz++;
                        console.log("reguler :" + zz);
                    } else {
                        let data = rawRalan(e, cariSEP);
                        dataRAW.push(data);
                        zx++;
                        console.log("chace :" + zx);
                    }

                }
                console.log("reguler :" + zz);
                console.log("chace :" + zx);
                console.log("error :" + er);
                // grup FPK
                let groupFPK = groupData(dataRAW.map(item => item.noFPK)).duplicatesWithCount;
                let groupdataFPK = [];
                for (const element of groupFPK) {
                    let data = {
                        noFPK: element.value,
                        bySetujui: dataRAW.filter(item => item.noFPK == element.value).map(item => parseInt(item.bySetujui)).reduce((a, b) => a + b, 0),
                        byTarifGruper: dataRAW.filter(item => item.noFPK == element.value).map(item => parseInt(item.byTarifGruper)).reduce((a, b) => a + b, 0),
                        byTarifRS: dataRAW.filter(item => item.noFPK == element.value).map(item => parseInt(item.byTarifRS)).reduce((a, b) => a + b, 0),
                        count: element.count
                    }
                    groupdataFPK.push(data);
                }
                // grup DPJP
                let groupDPJP = groupData(dataRAW.map(item => item.nmDPJP)).duplicatesWithCount;
                let groupdataDPJP = [];
                for (const element of groupDPJP) {
                    let data = {
                        nmDPJP: element.value,
                        bySetujui: dataRAW.filter(item => item.nmDPJP == element.value).map(item => parseInt(item.bySetujui)).reduce((a, b) => a + b, 0),
                        byTarifRS: dataRAW.filter(item => item.nmDPJP == element.value).map(item => parseInt(item.byTarifRS)).reduce((a, b) => a + b, 0),
                        dokter_48: dataRAW.filter(item => item.nmDPJP == element.value).map(item => parseInt(item.dokter_48)).reduce((a, b) => a + b, 0),
                        count: element.count
                    }
                    groupdataDPJP.push(data);
                }
                // filter by groupDPJP
                console.log(groupDPJP);
                fs.writeFileSync('./cache/' + "raw " + param.nameType + ".json", JSON.stringify({ raw: dataRAW, DPJP: groupdataDPJP, FPK: groupdataFPK }));

                return res.status(200).json({
                    status: false,
                    message: 'Ralan',
                    record: {
                        dataRAW: dataRAW.length,
                        getDataSEP: getDataSEP.length,
                        groupdataDPJP,
                        groupdataFPK
                    },
                    data: dataRAW,
                    groupdataFPK,
                    // cariSEP
                });
            }
            if (param.pelayanan == 3) {
                let getDataSEP = await req.cache.json.get(`data:monitoring:klaim:${param.from}-${param.until}:1`, '$');
                if (getDataSEP == null) {
                    let x = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=1&status=3');
                    getDataSEP = x.data.response.data;
                    req.cache.json.set(`data:monitoring:klaim:${param.from}-${param.until}:1`, '$', x.data.response.data);
                    req.cache.expire(`data:monitoring:klaim:${param.from}-${param.until}:1`, 1200);
                }

                // grup tgl SEP 
                // let groupSEP = groupData(getDataSEP.map(item => item.tglSep));
                let noSEPs = getDataSEP.map(item => item.noSEP);
                let getSEPSIMRS = await bridging_sep.findAll({
                    where: {
                        no_sep: noSEPs,
                        jnspelayanan: '1'
                    },
                    attributes: ['no_rawat', 'nomr', 'no_sep', 'nmdiagnosaawal', 'kddpjp', 'nmdpdjp'],
                });
                // let kamarInaps = await kamar_inap.findAll({
                //     where: {
                //         no_rawat: getSEPSIMRS.map(item => item.no_rawat),
                //     },
                //     attributes: ['no_rawat', 'kd_kamar', 'tgl_masuk', 'tgl_keluar', 'stts_pulang', 'lama'],
                // });
                return res.status(200).json({
                    status: false,
                    message: 'Ralan',
                    record: {
                        getDataSEP: getDataSEP,
                        getSEPSIMRS: getSEPSIMRS.length,
                        // kamarInaps: kamarInaps
                    },
                }
                );
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: 'error',
                data: error.message
            });
        }
    },
    monitoringJasa: async (req, res) => {
        try {
            let param = req.query;
            let belum = [];
            let klaim = [];
            let getData = await req.cache.json.get(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, '$');
            if (getData == null) {
                getData = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=' + param.status);
                getData = getData.data.response.data;
                req.cache.json.set(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, '$', getData);
                req.cache.expire(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, 60 * 60);
            }
            klaim = getData;
            const FPK = klaim.map(item => item.noFPK);
            // grup FPK 
            let groupFPK = groupData(FPK).duplicatesWithCount;
            let groupdataFPK = [];
            for (const element of groupFPK) {
                let data = {
                    noFPK: element.value,
                    bySetujui: klaim.filter(item => item.noFPK == element.value).map(item => parseInt(item.biaya.bySetujui)).reduce((a, b) => a + b, 0),
                    byTarifGruper: klaim.filter(item => item.noFPK == element.value).map(item => parseInt(item.biaya.byTarifGruper)).reduce((a, b) => a + b, 0),
                    byTarifRS: klaim.filter(item => item.noFPK == element.value).map(item => parseInt(item.biaya.byTarifRS)).reduce((a, b) => a + b, 0),
                    count: element.count
                }
                groupdataFPK.push(data);
            }
            for (let e of klaim) {
                // convert to number
                e.biaya.bySetujui = parseInt(e.biaya.bySetujui);
                e.biaya.byTarifGruper = parseInt(e.biaya.byTarifGruper);
                e.biaya.byTarifRS = parseInt(e.biaya.byTarifRS);
            }
            if (param.dataINACBG == undefined) {
                return res.status(200).json({
                    dataFPK: groupdataFPK,
                    Klaim: klaim

                });
            }

            const fileContent = fs.readFileSync('controllers/inacbg/' + param.dataINACBG, 'utf-8');
            let inacbg = JSON.parse(fileContent);
            inacbg = inacbg.filter(item => item.PTD === parseInt(param.pelayanan));
            belum = inacbg.filter(item => !klaim.find(x => x.noSEP === item.SEP));
            let TARIF_INACBG = belum.map(item => parseInt(item.TARIF_INACBG)).reduce((a, b) => a + b, 0);
            let TARIF_RS = belum.map(item => parseInt(item.TARIF_RS)).reduce((a, b) => a + b, 0);
            if (param.pelayanan == 1) {
                let js_pr = {
                    "Bangsal Anak": [],
                    "Bangsal Bedah": [],
                    "Bangsal Isolasi Utama": [],
                    "Bangsal ICU": [],
                    "Bangsal Kelas 1 B": [],
                    "Bangsal Kelas 1 C": [],
                    "Bangsal Nifas": [],
                    "Bangsal Penyakit Dalam": [],
                    "Bangsal Perinatologi": [],
                    "Bangsal Saraf": [],
                    "Bangsal VIP": [],
                    "Bangsal VK": [],
                    "Bangsal VK Bayi Sehat": [],
                };
                let js_dpjp = {
                    AGUSTINUS: [],
                    ALFONS: [],
                    "ARI ": [],
                    BORIS: [],
                    DAVIS: [],
                    DIANA: [],
                    DJOKO: [],
                    ESTU: [],
                    FENNY: [],
                    FREDDY: [],
                    HANARTO: [],
                    HARTONO: [],
                    HERLING: [],
                    HERISA: [],
                    MARKUS: [],
                    MARSITA: [],
                    MUDIB: [],
                    MUSLIM: [],
                    MARIA: [],
                    NOVI: [],
                    RAHMAD: [],
                    RACHIM: [],
                    RADHITIO: [],
                    SONNY: [],
                    STEVIE: [],
                    TEGUH: [],
                    TOGU: [],
                    UNDARI: [],
                    VIVI: [],
                    YUNITA: [],
                    ZAINUL: [],
                    YESSIKA: [],
                    RANTAPINA: []
                };

                let simrsSEP = await req.cache.json.get(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:simrsSEP`, '$');
                if (simrsSEP == null) {
                    simrsSEP = await bridging_sep.findAll({
                        where: {
                            no_sep: belum.map(item => item.SEP),
                        },
                        include: [{
                            model: maping_dokter_dpjpvclaim,
                            as: 'maping_dokter_dpjpvclaim',
                            attributes: ['nm_dokter_bpjs', 'kd_dokter_bpjs'],
                        }, {
                            model: pasien,
                            as: 'pasien',
                            attributes: ['no_peserta', 'nm_pasien', 'tgl_lahir'],
                        }
                        ],
                        attributes: ['no_rawat', 'no_sep', 'nomr', 'tanggal_lahir', 'nmdiagnosaawal', 'nmdpdjp', 'kddpjp'],
                    });
                    req.cache.json.set(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:simrsSEP`, '$', simrsSEP);
                    req.cache.expire(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:simrsSEP`, 60 * 60);
                }
                let dataKamar = await req.cache.json.get(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:dataKamar`, '$');
                if (dataKamar == null) {
                    dataKamar = await kamar_inap.findAll({
                        where: {
                            no_rawat: simrsSEP.map(item => item.no_rawat),
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
                        attributes: ['no_rawat', 'kd_kamar', 'tgl_masuk', 'tgl_keluar', 'stts_pulang', 'lama'],
                    });
                    req.cache.json.set(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:dataKamar`, '$', dataKamar);
                    req.cache.expire(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:dataKamar`, 60 * 60);
                }
                let reg_maksuk = await req.cache.json.get(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:reg_maksuk`, '$');
                if (reg_maksuk == null) {
                    reg_maksuk = await reg_periksa.findAll({
                        where: {
                            no_rawat: simrsSEP.map(item => item.no_rawat),
                        },
                        include: [{
                            model: poliklinik,
                            as: 'poliklinik',
                            attributes: ['nm_poli']
                        }],
                        attributes: ['no_rawat', 'kd_poli'],
                    });
                    req.cache.json.set(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:reg_maksuk`, '$', reg_maksuk);
                    req.cache.expire(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:reg_maksuk`, 60 * 60);
                }

                // gabung data simrsSEP dengan belum
                let dataRanap = [];
                for (const element of simrsSEP) {
                    let dataINA = belum.find(item => item.SEP === element.no_sep);
                    let prolis = dataINA.PROCLIST;
                    let DIAGLIST = dataINA.DIAGLIST;
                    let jalurMasuk = reg_maksuk.find(item => item.no_rawat === element.no_rawat).poliklinik.nm_poli;
                    let lastKamar = dataKamar.filter(item => item.no_rawat === element.no_rawat);
                    let igd = (jalurMasuk == 'IGD') ? true : false;
                    let hemo = (findProlist(prolis, '39.95') || findProlist(prolis, '38.93') || findProlist(prolis, '38.95')) ? true : false;
                    let venti = (findProlist(prolis, '96.72') || findProlist(prolis, '96.71')) ? true : false;
                    let bedah = dataINA.PROSEDUR_BEDAH > 0 ? true : false;
                    let bagi_rs = BPJS_Setujui(parseInt(dataINA.TOTAL_TARIF));
                    let duit_formasi = formasi(bagi_rs.Jasa_pelayanan, venti, bedah);
                    let bagi_penujang = penujang(duit_formasi.bangsal, igd, bedah);
                    let bagi_tindakanPerawat = tindakanPerawat(bagi_penujang.tindakan2persen, prolis)
                    let sisa2 = Math.round(bagi_penujang.tindakan2persen - bagi_tindakanPerawat.tindakan_usg - bagi_tindakanPerawat.fisioterapi - bagi_tindakanPerawat.EKG - bagi_tindakanPerawat.GDS - bagi_tindakanPerawat.USG);
                    let bagi_medis = medis(bagi_penujang.sisa, hemo);
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
                    let dataKlaim = {
                        noFPK: '-',
                        noSEP: element.no_sep,
                        nama_pasien: dataINA.NAMA_PASIEN,
                        noMR: element.nomr,
                        noBPJS: element.pasien.no_peserta,
                        kelasRawat: dataINA.KELAS_RAWAT,
                        tglSep: dataINA.ADMISSION_DATE,
                        tglPulang: dataINA.DISCHARGE_DATE,
                        kode_inacbg_bpjs: dataINA.INACBG,
                        nama_inacbg_bpjs: dataINA.DESKRIPSI_INACBG,
                        TOTAL_TARIF: parseInt(dataINA.TOTAL_TARIF),
                        TARIF_RS: dataINA.TARIF_RS,
                        TARIF_BPJS: parseInt(0),
                        TARIF_PROSEDUR_BEDAH: dataINA.PROSEDUR_BEDAH,
                        LOS: dataINA.LOS,
                        ICU_INDIKATOR: dataINA.ICU_INDIKATOR,
                        ICU_LOS: dataINA.ICU_LOS,
                        VENT_HOUR: dataINA.VENT_HOUR,
                        jalurMasuk: jalurMasuk,
                        kamar1: lastKamar[0].kd_kamar + ' - stts_pulang: ' + lastKamar[0].stts_pulang + ' - ' + lastKamar[0].lama + ' hari',
                        Bangsal1: lastKamar[0].kode_kamar.bangsal.nm_bangsal,
                        js_pr_inapB1: js_pr_inapB1,
                        Kamar2: lastKamar[1] ? lastKamar[1].kd_kamar + ' - stts_pulang: ' + lastKamar[1].stts_pulang + ' - ' + lastKamar[1].lama + ' hari' : null,
                        Bangsal2: lastKamar[1] ? lastKamar[1].kode_kamar.bangsal.nm_bangsal : '-',
                        js_pr_inapB2: js_pr_inapB2,
                        Kamar3: lastKamar[2] ? lastKamar[2].kd_kamar + ' - stts_pulang: ' + lastKamar[2].stts_pulang + ' - ' + lastKamar[2].lama + ' hari' : null,
                        Bangsal3: lastKamar[2] ? lastKamar[2].kode_kamar.bangsal.nm_bangsal : '-',
                        js_pr_inapB3: js_pr_inapB3,
                        Kamar4: lastKamar[3] ? lastKamar[3].kd_kamar + ' - stts_pulang: ' + lastKamar[3].stts_pulang + ' - ' + lastKamar[3].lama + ' hari' : null,
                        Bangsal4: lastKamar[3] ? lastKamar[3].kode_kamar.bangsal.nm_bangsal : '-',
                        js_pr_inapB4: js_pr_inapB4,
                        DESKRIPSI_INACBG: dataINA.DESKRIPSI_INACBG,
                        DIAGLIST: String(DIAGLIST),
                        PROCLIST: String(prolis),
                        DPJP_INACBG: dataINA.DPJP,
                        dpjp_ranap_bpj: element.maping_dokter_dpjpvclaim.nm_dokter_bpjs,
                        dpjp_ranap_RS1: '-',
                        dpjp_ranap_RS2: '-',
                        dpjp_ranap_RS3: '-',
                        dpjp_ranap_RS4: '-',
                        ventilation_more96: findProlist(prolis, '96.72') ? "Y" : "N",
                        ventilation_less96: findProlist(prolis, '96.71') ? "Y" : "N",
                        endotracheal_intubasi: findProlist(prolis, '96.04') ? "Y" : "N",
                        IGD: igd ? "Y" : "N",
                        VENTI: venti ? "Y" : "N",
                        BEDAH: bedah ? "Y" : "N",
                        CVC: findProlist(prolis, '38.93') ? "Y" : "N",
                        CDL: findProlist(prolis, '38.95') ? "Y" : "N",
                        Bronkoskopi: findProlist(prolis, '33.23') ? "Y" : "N",
                        EEG: findProlist(prolis, '89.14') ? "Y" : "N",
                        CTG: findProlist(prolis, '75.32') ? "Y" : "N",
                        Biopsi: findProlist(prolis, '45.15') ? "Y" : "N",
                        "spinal canal": findProlist(prolis, '03.92') ? "Y" : "N",
                        curettage: findProlist(prolis, '69.09') ? "Y" : "N",
                        tindakan_usg: bagi_tindakanPerawat.tindakan_usg,
                        Jasa_sarana: bagi_rs.Jasa_sarana,
                        Jasa_pelayanan: bagi_rs.Jasa_pelayanan,
                        formasi_bangsal: duit_formasi.bangsal,
                        bcu: bagi_penujang.bcu,
                        "tindakan2%": bagi_penujang.tindakan2persen,
                        fisio: bagi_tindakanPerawat.fisioterapi,
                        ekg: Math.round(bagi_tindakanPerawat.EKG),
                        gds: Math.round(bagi_tindakanPerawat.GDS),
                        usg: Math.round(bagi_tindakanPerawat.USG),
                        "sisa2%": sisa2,
                        struktural: bagi_penujang.BJP_strutural,
                        lab: bagi_penujang.lab,
                        mikro: bagi_penujang.mkro,
                        farmasi: bagi_penujang.farmasi,
                        radiologi: bagi_penujang.radiologi,
                        drIGD: bagi_penujang.drIGD,
                        pr_igd: bagi_penujang.pr_igd,
                        dikurangi: bagi_penujang.sisa,
                        dr_DPJP_48: bagi_medis.dr_DPJP_48,
                        pr_31: bagi_medis.pr_31,
                        pr_ruangan: bagi_medis.pr_ruangan,
                        hemo: bagi_medis.hemodialisa,
                        managemnt_21: bagi_medis.mm_21,
                        formasi_bedah: duit_formasi.bedah,
                        dpjp_oka_60: duit_oka.dpjp_OK,
                        dr_operator_OK: duit_oka.dr_operator_OK,
                        pr_operator_OK: duit_oka.pr_operator_OK,
                        cssd: duit_oka.cssd,
                        anestesi_35: duit_oka.anestsi_OK,
                        dr_anestesi_OK: duit_oka.dr_anestesi,
                        formasi_venti: duit_formasi.venti,
                        dr_anestesi_venti: duit_ventilator.dr_anestesi,
                        pr_venti: duit_ventilator.pr_ventilator,
                        dr_ventilator: duit_ventilator.dr_ventilator
                    }
                    dataRanap.push(dataKlaim);
                    for (let key in js_pr) {
                        let js = parsingBangsalPending(dataKlaim, key);
                        if (js !== null) {
                            js_pr[key].push(js);
                        }
                    }

                    for (let key in js_dpjp) {
                        let js = parsingDPJP(dataKlaim, key, js_dpjp);
                        if (js !== null) {
                            js_dpjp[key].push(js);
                        }
                    }
                }
                fs.writeFileSync('./cache/' + "bangsal pending.json", JSON.stringify(js_pr));
                fs.writeFileSync('./cache/' + "dpjp pending.json", JSON.stringify(js_dpjp));
                fs.writeFileSync('./cache/' + "raw pending.json", JSON.stringify({
                    repot: [
                        ...groupdataFPK,
                        {
                            "noFPK": "-",
                            "bySetujui": 0,
                            "byTarifGruper": TARIF_INACBG,
                            "byTarifRS": TARIF_RS,
                            "count": belum.length,
                        }
                    ], raw: dataRanap
                }));



                return res.status(200).json({
                    status: true,
                    message: 'Data klaim Ranap',
                    record: {
                        klaim: klaim.length,
                        inacbg: inacbg.length,
                        belum: belum.length,
                        simrsSEP: simrsSEP.length
                    },
                    dataRanap,
                    simrsSEP,
                    belum,
                    dataKamar,
                });

            }

            return res.status(200).json({
                status: true,
                message: 'Data klaim Ranap',
                record: {
                    klaim: klaim.length,
                    inacbg: inacbg.length,
                    belum: belum.length,
                },
                dataFPK: [
                    ...groupdataFPK,
                    {
                        "noFPK": "-",
                        "bySetujui": 0,
                        "byTarifGruper": TARIF_INACBG,
                        "byTarifRS": TARIF_RS,
                        "count": belum.length,
                    }
                ],

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
    },
    remon: async (req, res) => {
        try {
            let param = req.query;
            // RANAP
            if (param.pelayanan == 1) {
                let getChace = fs.readFileSync('cache/' + 'RawRanapJS' + '.json');
                if (getChace) {
                    let data = JSON.parse(getChace);
                    let raw = [];
                    let datanoFPK = [];
                    for (let e of data) {
                        let bedah = e.realcost.PROSEDUR_BEDAH > 0 ? true : false;
                        let venti = (findProlist(e.PROCLIST, '96.72') || findProlist(e.PROCLIST, '96.71')) ? true : false;
                        // let hemo = (findProlist(e.PROCLIST, '39.95') || findProlist(e.PROCLIST, '38.93') || findProlist(e.PROCLIST, '38.95')) ? true : false;
                        let Jasa_pelayanan = parseInt(e.biaya.bySetujui) * 0.35;
                        let pembagian = fomulaRemon(Jasa_pelayanan, bedah, venti);
                        let formulasi = formasi(pembagian.Medis, venti, bedah);
                        let forBedah = formasiBedah(formulasi.bedah);
                        let forVenti = formasiVenti(formulasi.venti);
                        let y = {
                            noFPK: e.noFPK,
                            noSEP: e.noSEP,
                            tglSep: e.tglSep,
                            tglPulang: e.tglPulang,
                            lamaRawat: e.LOS,
                            kelasRawat: e.kelasRawat,
                            kamar: e.kamarInap,
                            nmPasien: e.peserta.nama,
                            noMR: e.peserta.noMR,
                            noBPJS: e.peserta.noBPJS,
                            tglLahir: e.BIRTH_DATE,
                            umur: e.UMUR_TAHUN,
                            sex: e.SEX === 1 ? 'Laki-laki' : 'Perempuan',
                            ICD10: e.DIAGLIST,
                            ICD9: e.PROCLIST,
                            paketInacbg: e.Inacbg.nama + ' (' + e.Inacbg.kode + ')',
                            desInacbg: e.DESKRIPSI_INACBG,
                            bedah: bedah ? "Y" : "N",
                            venti: venti ? "Y" : "N",
                            ventilation_more96: findProlist(e.PROCLIST, '96.72') ? "Y" : "N",
                            ventilation_less96: findProlist(e.PROCLIST, '96.71') ? "Y" : "N",
                            endotracheal_intubasi: findProlist(e.PROCLIST, '96.04') ? "Y" : "N",
                            hd: findProlist(e.PROCLIST, '39.95') ? "Y" : "N",
                            cvc: findProlist(e.PROCLIST, '38.93') ? "Y" : "N",
                            cdl: findProlist(e.PROCLIST, '38.95') ? "Y" : "N",
                            bronkoskopi: findProlist(e.PROCLIST, '33.23') ? "Y" : "N",
                            eeg: findProlist(e.PROCLIST, '89.14') ? "Y" : "N",
                            ctg: findProlist(e.PROCLIST, '75.32') ? "Y" : "N",
                            biopsi: findProlist(e.PROCLIST, '45.15') ? "Y" : "N",
                            spinal_canal: findProlist(e.PROCLIST, '03.92') ? "Y" : "N",
                            curettage: findProlist(e.PROCLIST, '69.09') ? "Y" : "N",
                            endos: findProlist(e.PROCLIST, '45.22') ? "Y" : "N",
                            endoscopy: findProlist(e.PROCLIST, '45.23') ? "Y" : "N",
                            dpjpBPJS: e.nmdpdjp ? e.nmdpdjp : e.nmDPJP,
                            kdDpjpBPJS: e.kddpjp ? e.kddpjp : e.kdDPJP,
                            dpjpRS: e.DPJP_RANAP,
                            jumlahDPJPRS: e.jumlahDPJPRS,
                            DPJP_INACBG: e.DPJP_INACBG,
                            tarifInacbg: e.biaya.TARIF_INACBG,
                            tarifRS: e.biaya.TARIF_RS,
                            tarifBedah: e.realcost.PROSEDUR_BEDAH,
                            bySetujui: e.biaya.bySetujui,
                            Jasa_pelayanan: Jasa_pelayanan,
                            Radiologi: pembagian.Radiologi,
                            LabPK: pembagian.Labotarium,
                            LabMB: pembagian.Microbiologi,
                            Farmasi: pembagian.Farmasi,
                            Rehap_Medik: pembagian.Rehap_Medik,
                            UTD: pembagian.UTD,
                            Struktrual: pembagian.Struktrual,
                            Manajemen: pembagian.Manajemen,
                            Paramedis: pembagian.Paramedis,
                            Medis: pembagian.Medis,
                            JsDPJP: formulasi.bangsal,
                            JsBEDAH: formulasi.bedah,
                            paguOperator65: forBedah.pOperator,
                            drOperator: forBedah.drOperator,
                            // cssd: forBedah.cssd,
                            prOperator: forBedah.prOperator,
                            paguAnestesi35: forBedah.pAnestesi,
                            drAnestesi: forBedah.drAnestesi,
                            prAnestesi: forBedah.prAnestesi,
                            JsVENTI: formulasi.venti,
                            drVenti: forVenti.drVenti,
                            prVenti: forVenti.prVenti,
                            dpjpVenti: forVenti.drDPJP,
                            drAnestesiVenti: forVenti.drAnestesi,
                        }
                        raw.push(y);
                        if (datanoFPK.find(obj => obj.noFPK === e.noFPK)) {
                            let foundObject = datanoFPK.find(obj => obj.noFPK === e.noFPK)
                            if (foundObject) {
                                foundObject.byTarifRS += parseInt(e.biaya.TARIF_RS);
                                foundObject.bySetujui += parseInt(e.biaya.bySetujui);
                                foundObject.count++
                            }
                        } else {
                            let newObj = { noFPK: e.noFPK, bySetujui: parseInt(e.biaya.bySetujui), byTarifRS: parseInt(e.biaya.byTarifRS), count: 1 };
                            datanoFPK.push(newObj)

                        }
                    }
                    fs.writeFileSync('./cache/' + "RawRanap4FPK.json", JSON.stringify({
                        report: datanoFPK,
                        raw: raw
                    }));
                    let dataDPJP = fs.readFileSync('controllers/inacbg/index/DPJP.json');
                    let dpjpBedah = fs.readFileSync('controllers/inacbg/index/nmDPJPbedah.json');
                    let dpjp = fs.readFileSync('controllers/inacbg/index/nmDPJP.json');
                    let bedah = fs.readFileSync('controllers/inacbg/index/nmBedah.json');
                    dataDPJP = JSON.parse(dataDPJP);
                    dpjpBedah = JSON.parse(dpjpBedah);
                    dpjp = JSON.parse(dpjp);
                    bedah = JSON.parse(bedah);
                    for (let e in dataDPJP) {
                        for (let i of raw) {
                            // console.log(i.DPJP_INACBG);
                            if (i.DPJP_INACBG.includes(e)) {
                                let dpjpRaber = 0;
                                let op = 0;
                                if (i.bedah == "Y") {
                                    for (let x of dpjpBedah) {
                                        if (i.DPJP_INACBG.includes(x)) {
                                            dpjpRaber++;
                                            op++;
                                        }
                                    }

                                }
                                if (i.bedah == "N") {
                                    for (let x of dpjp) {
                                        if (i.DPJP_INACBG.includes(x)) {
                                            dpjpRaber++;
                                        }
                                    }
                                }

                                i.jumlDpjpRaber = dpjpRaber;
                                i.dpjpke = 0;
                                i.jasDPJP = 0;
                                i.jasRaber = 0;

                                i.jumlOperator = op;
                                i.operatorke = 0;
                                i.jsOperator = 0;
                                dataDPJP[e].push(i);

                            }
                        }
                    }
                    fs.writeFileSync('./cache/' + "RawRanapDPJP.json", JSON.stringify(dataDPJP));


                    return res.status(200).json({
                        status: true,
                        message: 'Data klaim Ranap',
                        record: {
                            klaim: data.length,
                            FPK: datanoFPK.length,
                        },
                        dataFPK: datanoFPK,
                        getData: raw
                        // data: getSEPSIMRS
                    });

                }
                let getData = await req.cache.json.get(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, '$');
                if (getData == null) {
                    getData = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=' + param.status);
                    getData = getData.data.response.data;
                    req.cache.json.set(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, '$', getData);
                    req.cache.expire(`data:monitoring:Pendingklaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, 60 * 60);
                }
                let inacbg = fs.readFileSync('cache/' + param.dataINACBG, 'utf-8');
                inacbg = JSON.parse(inacbg);
                let mapSEP = getData.map(item => item.noSEP);
                let getSEPSIMRS = await bridging_sep.findAll({
                    where: {
                        no_sep: mapSEP,
                        jnspelayanan: '1',
                    },
                    attributes: ['no_rawat', 'nomr', 'no_sep', 'nmdiagnosaawal', 'kddpjp', 'nmdpdjp'],
                });
                let sepBackded = getData.filter(item => !getSEPSIMRS.find(x => x.no_sep === item.noSEP));
                for (let e of sepBackded) {
                    let regData = await reg_periksa.findOne({
                        where: {
                            no_rkm_medis: e.peserta.noMR,
                            tgl_registrasi: e.tglSep
                        },
                        attributes: ['no_rawat'],
                        include: [{
                            model: maping_dokter_dpjpvclaim,
                            as: 'maping_dokter_dpjpvclaim',
                        }]
                    });
                    e.no_rawat = regData.no_rawat;
                    e.nmDPJP = regData.maping_dokter_dpjpvclaim.nm_dokter_bpjs;
                    e.kdDPJP = regData.maping_dokter_dpjpvclaim.kd_dokter_bpjs;
                    // e.regData = regData;
                }

                for (let e of getData) {
                    let dataINA = inacbg.find(item => item.SEP === e.noSEP);
                    // console.log((e.noSEP));
                    e.biaya.bySetujui = parseInt(e.biaya.bySetujui);
                    // e.biaya.bySetujui = parseInt(dataINA.TARIF_INACBG);
                    e.biaya.TARIF_INACBG = dataINA.TARIF_INACBG;
                    e.biaya.TARIF_RS = dataINA.TARIF_RS;
                    e.biaya.TARIF_POLI_EKS = dataINA.TARIF_POLI_EKS;
                    e.realcost = {
                        PROSEDUR_NON_BEDAH: dataINA.PROSEDUR_NON_BEDAH,
                        PROSEDUR_BEDAH: dataINA.PROSEDUR_BEDAH,
                        PENUNJANG: dataINA.PENUNJANG,
                        KEPERAWATAN: dataINA.KEPERAWATAN,
                        KONSULTASI: dataINA.KONSULTASI,
                        RADIOLOGI: dataINA.RADIOLOGI,
                        LABORATORIUM: dataINA.LABORATORIUM,
                        PELAYANAN_DARAH: dataINA.PELAYANAN_DARAH,
                        KAMAR_AKOMODASI: dataINA.KAMAR_AKOMODASI,
                        OBAT: dataINA.OBAT,
                        ALKES: dataINA.ALKES,
                        BMHP: dataINA.BMHP,
                        REHABILITASI: dataINA.REHABILITASI
                    }
                    e.BIRTH_DATE = dataINA.BIRTH_DATE;
                    e.UMUR_TAHUN = dataINA.UMUR_TAHUN;
                    e.SEX = dataINA.SEX;
                    e.DIAGLIST = dataINA.DIAGLIST;
                    e.PROCLIST = dataINA.PROCLIST;
                    e.DESKRIPSI_INACBG = dataINA.DESKRIPSI_INACBG;
                    e.LOS = dataINA.LOS;
                    e.DPJP_INACBG = dataINA.DPJP;
                    let getSIMRS = getSEPSIMRS.find(item => item.no_sep === e.noSEP);
                    if (getSIMRS) {
                        e.no_rawat = getSIMRS.no_rawat;
                        e.nmdpdjp = getSIMRS.nmdpdjp;
                        e.kddpjp = getSIMRS.kddpjp;
                    }
                    let raberDPJP = await dpjp_ranap.findAll({
                        where: {
                            no_rawat: e.no_rawat,
                        },
                        attributes: ['kd_dokter'],
                        include: [{
                            model: dokter,
                            as: 'dokter',
                            attributes: ['nm_dokter']
                        }],
                    });
                    e.raberDPJP = raberDPJP;
                    e.jumlahDPJP = raberDPJP.length;
                    if (raberDPJP.length > 0) {
                        e.DPJP_RANAP = raberDPJP.map(item => item.dokter.nm_dokter).join(', ');
                    } else {
                        e.DPJP_RANAP = '-';
                    }
                    let findBed = await kamar_inap.findAll({
                        where: {
                            no_rawat: e.no_rawat,
                        },
                        // attributes: ['kd_kamar', 'lama', 'tgl_masuk', 'tgl_keluar', 'stts_pulang'],
                        include: [{
                            model: kamar,
                            as: 'kode_kamar',
                            attributes: ['kd_bangsal'],
                            include: [{
                                model: bangsal,
                                as: 'bangsal',
                                // attributes: ['nm_bangsal']
                            }]
                        }],
                    });
                    // console.log(findBed);
                    e.kamar = findBed
                    let namaKamar = findBed.map(item => item.dataValues.kode_kamar.bangsal.nm_bangsal + " - " + item.dataValues.lama + " hari").join(', ');
                    e.kamarInap = namaKamar;
                }
                fs.writeFileSync('./cache/' + "RawRanapJS.json", JSON.stringify(getData));

                return res.status(200).json({
                    status: true,
                    message: 'Data klaim Ranap',
                    record: {
                        klaim: getData.length,
                        inacbg: inacbg.length,
                        getSEPSIMRS: getSEPSIMRS.length,
                        sepBackded: sepBackded.length
                    },
                    getData: getData
                    // data: getSEPSIMRS
                });
            }
            if (param.pelayanan == 2) {
                let getData = await req.cache.json.get(`data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, '$');
                if (getData == null) {
                    getData = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=' + param.status);
                    getData = getData.data.response.data;
                    let getData2 = await axios.get(url_bpjs + '/api/bpjs/monitoring/klaim?from=' + param.from + '&until=' + param.until + '&pelayanan=' + param.pelayanan + '&status=1');
                    getData2 = getData2.data.response.data;
                    getData = getData.concat(getData2);
                    req.cache.json.set(`data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, '$', getData);
                    req.cache.expire(`data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`, 60 * 60);
                }
                let sepKlaim = getData.map(item => item.noSEP);
                let getSEPSIMRS = await bridging_sep.findAll({
                    where: {
                        no_sep: sepKlaim,
                        jnspelayanan: '2',
                    },
                    include: [{
                        model: maping_dokter_dpjpvclaim,
                        as: 'maping_dokter_dpjpvclaim',
                    }],
                    attributes: ['no_rawat', 'nomr', 'no_sep', 'nmdiagnosaawal', 'kddpjp', 'nmdpdjp'],
                });
                let sepBackded = getData.filter(item => !getSEPSIMRS.find(x => x.no_sep === item.noSEP));
                for (let e of sepBackded) {
                    let regData = await reg_periksa.findOne({
                        where: {
                            no_rkm_medis: e.peserta.noMR,
                            tgl_registrasi: e.tglSep
                        },
                        attributes: ['no_rawat'],
                        include: [{
                            model: maping_dokter_dpjpvclaim,
                            as: 'maping_dokter_dpjpvclaim',
                        }]
                    });
                    e.no_rawat = regData.no_rawat;
                    e.kddpjp = regData.maping_dokter_dpjpvclaim.kd_dokter_bpjs;
                    e.nmdpdjp = regData.maping_dokter_dpjpvclaim.nm_dokter_bpjs;
                    // e.regData = regData;
                }
                for (let e of getData) {
                    let dataSIMRS = getSEPSIMRS.find(item => item.no_sep === e.noSEP);
                    if (dataSIMRS) {
                        console.log(dataSIMRS.no_sep);
                        e.no_rawat = dataSIMRS.no_rawat;
                        e.kddpjp = dataSIMRS.maping_dokter_dpjpvclaim.kd_dokter_bpjs;
                        e.nmdpdjp = dataSIMRS.maping_dokter_dpjpvclaim.nm_dokter_bpjs;
                    }
                }
                let noRawat = getData.map(item => item.no_rawat);
                let raberDPJP = await rujukan_internal_poli.findAll({
                    where: {
                        no_rawat: noRawat,
                    },
                    // attributes: ['kd_dokter'],
                    include: [{
                        model: maping_dokter_dpjpvclaim,
                        as: 'maping_dokter_dpjpvclaim',
                        // attributes: ['nm_dokter']
                    }, {
                        model: poliklinik,
                        as: 'poliklinik',
                        // attributes: ['nm_dokter']
                    }],
                });
                let datanoFPK = [];
                let ralanDPJPUtama = [];
                // console.log(raberDPJP);
                for (let e of getData) {
                    let raber = raberDPJP.filter(item => item.no_rawat === e.no_rawat);
                    e.jumlahRaber = raber.length;

                    if (datanoFPK.find(obj => obj.noFPK === e.noFPK)) {
                        let foundObject = datanoFPK.find(obj => obj.noFPK === e.noFPK)
                        if (foundObject) {
                            foundObject.byTarifRS += parseInt(e.biaya.byTarifRS);
                            foundObject.bySetujui += parseInt(e.biaya.bySetujui);
                            foundObject.pasien++
                        }
                    } else {
                        let newObj = { noFPK: e.noFPK, bySetujui: parseInt(e.biaya.bySetujui), byTarifRS: parseInt(e.biaya.byTarifRS), pasien: 1 };
                        datanoFPK.push(newObj)

                    }
                    let Jasa_pelayanan = parseInt(e.biaya.bySetujui) * 0.33;
                    let pembagian = fomulaRemon(Jasa_pelayanan);
                    let jsRaber = fomulaRaber(pembagian.Medis, 1, raber.length + 1);
                    e.dpjpUtama = jsRaber.dpjpUtama;
                    e.dpjpRaber = jsRaber.dpjpRaber;
                    // console.log(e.no_rawat);
                    let jasaUtama = {
                        noFPK: e.noFPK,
                        noSEP: e.noSEP,
                        noRawat: e.no_rawat,
                        tglSep: e.tglSep,
                        tglPulang: e.tglPulang,
                        kelasRawat: e.kelasRawat,
                        poli: e.poli,
                        nmPasien: e.peserta.nama,
                        noMR: e.peserta.noMR,
                        noBPJS: e.peserta.noBPJS,
                        paketInacbg: e.Inacbg.nama + ' (' + e.Inacbg.kode + ')',
                        nmdpdjpUtama: e.nmdpdjp,
                        kddpjpUtama: e.kddpjp,
                        dpjpRaber: raber.map(item => item.maping_dokter_dpjpvclaim.nm_dokter_bpjs).join(', '),
                        poliRaber: raber.map(item => item.poliklinik.nm_poli).join(', '),
                        jmlRaber: raber.length,
                        bySetujui: parseInt(e.biaya.bySetujui),
                        byTarifRS: parseInt(e.biaya.byTarifRS),
                        Jasa_pelayanan: Jasa_pelayanan,
                        Radiologi: pembagian.Radiologi,
                        LabPK: pembagian.Labotarium,
                        LabMB: pembagian.Microbiologi,
                        Farmasi: pembagian.Farmasi,
                        Rehap_Medik: pembagian.Rehap_Medik,
                        UTD: pembagian.UTD,
                        Struktrual: pembagian.Struktrual,
                        Manajemen: pembagian.Manajemen,
                        Paramedis: pembagian.Paramedis,
                        Medis: pembagian.Medis,
                        JsDpjpUtama: jsRaber.dpjpUtama,
                        JsDpjpRaber: jsRaber.dpjpRaber
                    }
                    ralanDPJPUtama.push(jasaUtama);
                }
                let ralanDPJPRaber = [];
                for (let e of raberDPJP) {
                    let raber = ralanDPJPUtama.find(item => item.noRawat === e.no_rawat);
                    let jsRaber = fomulaRaber(raber.Medis, raber.jmlRaber + 1, raber.jmlRaber + 1);
                    if (raber) {
                        let jasaUtama = {
                            noFPK: raber.noFPK,
                            noSEP: raber.noSEP,
                            noRawat: raber.noRawat,
                            tglSep: raber.tglSep,
                            tglPulang: raber.tglPulang,
                            kelasRawat: raber.kelasRawat,
                            poli: raber.poli,
                            nmPasien: raber.nmPasien,
                            noMR: raber.noMR,
                            noBPJS: raber.noBPJS,
                            paketInacbg: raber.paketInacbg,
                            nmdpdjpUtama: raber.nmdpdjpUtama,
                            kddpjpUtama: raber.kddpjpUtama,
                            nmdpjpRaber: e.maping_dokter_dpjpvclaim.nm_dokter_bpjs,
                            nmPoliRaber: e.poliklinik.nm_poli,
                            jmlRaber: raber.jmlRaber,
                            dpjpRaber: raber.dpjpRaber,
                            poliRaber: raber.poliRaber,
                            bySetujui: raber.bySetujui,
                            byTarifRS: raber.byTarifRS,
                            Jasa_pelayanan: raber.Jasa_pelayanan,
                            Radiologi: raber.Radiologi,
                            LabPK: raber.LabPK,
                            LabMB: raber.LabMB,
                            Farmasi: raber.Farmasi,
                            Rehap_Medik: raber.Rehap_Medik,
                            UTD: raber.UTD,
                            Struktrual: raber.Struktrual,
                            Paramedis: raber.Paramedis,
                            Medis: raber.Medis,
                            JsDpjpUtama: jsRaber.dpjpUtama,
                            JsDpjpRaber: jsRaber.dpjpRaber
                        }
                        ralanDPJPRaber.push(jasaUtama);
                    }


                }
                fs.writeFileSync('./cache/' + "RawRalanUTAMA.json", JSON.stringify({
                    report: datanoFPK,
                    DPJP_UTAMA: ralanDPJPUtama,
                    DPJP_RABER: ralanDPJPRaber
                }));

                return res.status(200).json({
                    status: true,
                    message: 'Data klaim Ranap',
                    record: {
                        klaim: getData.length,
                        getSEPSIMRS: getSEPSIMRS.length,
                        sepBackded: sepBackded.length,
                        noRawat: noRawat.length,
                        raberDPJP: raberDPJP.length,
                        datanoFPK: datanoFPK
                    },
                    ralanDPJPUtama: ralanDPJPUtama,
                    ralanDPJPRaber: ralanDPJPRaber
                });
            }


            return res.status(200).json({
                // dataFPK: groupdataFPK,
                Klaim: param
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
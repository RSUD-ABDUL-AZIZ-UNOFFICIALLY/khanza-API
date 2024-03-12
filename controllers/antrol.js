const { Op } = require("sequelize");
const { reg_periksa, pasien, maping_poli_bpjs, maping_dokter_dpjpvclaim } = require('../models');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const url_bpjs = process.env.URL_BPJS
module.exports = {
    hit: async (req, res) => {
        if (!req.query.tanggal) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: 'tanggal is required'
            });
        }
        let dataPoli = await maping_poli_bpjs.findAll();
        let dataDr = await maping_dokter_dpjpvclaim.findAll();
        let jadwalDr = [];
        for (let x of dataPoli) {
            let jadwal = await axios.get(url_bpjs + `/api/bpjs/antrean/jadwaldokter?tanggal=${req.query.tanggal}&kd_poli_BPJS=${x.kd_poli_bpjs}`);
            if (jadwal.data.metadata.code === 200) {
                let jadwal_dr = jadwal.data.response
                jadwalDr = jadwalDr.concat(jadwal_dr);
            }
        }
        let pxTidakLengkap = [];
        let dataAntrol = [];
        let logAntrol = [];
        try {
            let sepTerbit = await axios.get(url_bpjs + `/api/bpjs/monitoring/kunjungan?from=${req.query.tanggal}&until=${req.query.tanggal}&pelayanan=2`);
            let dataSEP = sepTerbit.data.response.data;
            dataSEP = dataSEP.filter(item => item.poli !== 'IGD');
            try {
                let oldDataAntrol = fs.readFileSync('./cache/' + `antrol${req.query.tanggal}.json`);
                if (oldDataAntrol) {
                    dataAntrol = JSON.parse(oldDataAntrol);
                    for (let x of dataAntrol) {
                        dataSEP = dataSEP.filter(item => item.noRujukan !== x.nomorreferensi);
                    }
                }
            } catch (error) {

            }

            for (let x of dataSEP) {
                let dataPx = await axios.get(url_bpjs + `/api/bpjs/peserta/nokartu?nik=${x.noKartu}&tglSEP=${req.query.tanggal}`);
                x.dataPx = dataPx.data.response;
                if (x.dataPx.peserta.mr.noMR === null) {
                    pxTidakLengkap.push(x);
                }
                let reg_px = await reg_periksa.findOne({
                    where: {
                        [Op.and]: [
                            { tgl_registrasi: req.query.tanggal },
                            { no_rkm_medis: x.dataPx.peserta.mr.noMR }
                        ],
                    },
                    attributes: ['kd_dokter', 'jam_reg', 'tgl_registrasi', 'no_reg', 'stts_daftar', 'no_rawat'],
                });
                if (reg_px === null) {
                    pxTidakLengkap.push(x);
                }
                x.reg_px = reg_px;
                let data_poli = dataPoli.find(item => item.kd_poli_bpjs === x.poli);
                x.nm_poli = data_poli;

            }
            dataSEP = dataSEP.filter(item => item.reg_px !== null);
            for (let x of dataSEP) {
                let nm_dokter = dataDr.find(item => item.kd_dokter === x.reg_px.kd_dokter);
                let jadwaldrPoli = jadwalDr.find(x => x.kodedokter === parseInt(nm_dokter.kd_dokter_bpjs));
                let jamReg = new Date(x.reg_px.tgl_registrasi + ' ' + x.reg_px.jam_reg);
                jamReg.setTime(jamReg.getTime() + 10 * 60 * 1000);
                let addAntrol = {
                    "kodebooking": x.reg_px.no_rawat,
                    "jenispasien": "JKN",
                    "nomorkartu": x.noKartu,
                    "nik": x.dataPx.peserta.nik,
                    "nohp": x.dataPx.peserta.mr.noTelepon,
                    "kodepoli": x.poli,
                    "namapoli": x.nm_poli.nm_poli_bpjs,
                    "pasienbaru": x.reg_px.stts_daftar === 'Baru' ? 1 : 0,
                    "norm": x.dataPx.peserta.mr.noMR,
                    "tanggalperiksa": req.query.tanggal,
                    "kodedokter": parseInt(nm_dokter.kd_dokter_bpjs),
                    "namadokter": nm_dokter.nm_dokter_bpjs,
                    "jampraktek": jadwaldrPoli.jadwal,
                    "jeniskunjungan": 3,
                    "nomorreferensi": x.noRujukan,
                    "nomorantrean": `${x.poli}-${x.reg_px.no_reg}`,
                    "angkaantrean": parseInt(x.reg_px.no_reg),
                    "estimasidilayani": jamReg.getTime(),
                    "sisakuotajkn": jadwaldrPoli.kapasitaspasien - parseInt(x.reg_px.no_reg),
                    "kuotajkn": jadwaldrPoli.kapasitaspasien,
                    "sisakuotanonjkn": jadwaldrPoli.kapasitaspasien - parseInt(x.reg_px.no_reg),
                    "kuotanonjkn": jadwaldrPoli.kapasitaspasien,
                    "keterangan": "Peserta harap 20 menit lebih awal guna pencatatan administrasi."
                }
                dataAntrol.push(addAntrol);
                let data = await axios.post(url_bpjs + '/api/bpjs/antrean/add', addAntrol);
                if (data.data.metadata.code === 201) {
                    logAntrol.push(addAntrol);
                }
                logAntrol.push(data.data);
            }
            // fs.writeFileSync('./cache/' + `antrol${req.query.tanggal}.json`, JSON.stringify(dataAntrol));
            fs.writeFileSync('./cache/' + `logAntrol${req.query.tanggal}.json`, JSON.stringify(logAntrol));
            return res.status(200).json({
                status: false,
                message: 'Success',
                record: dataSEP.length,
                pxTidakLengkap: pxTidakLengkap.length,
                dataAntrol,
                // data: dataSEP,
            });
        } catch (error) {
            console.log(error);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: error
            });
        }
    }
}
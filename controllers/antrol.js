const { Op } = require("sequelize");
const { reg_periksa, pasien, maping_poli_bpjs, maping_dokter_dpjpvclaim } = require('../models');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const url_bpjs = process.env.URL_BPJS;
const { createClient } = require('redis');
const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_URL_PORT
    }
});
client.connect();
module.exports = {
    hit: async (req, res) => {
        if (!req.query.tanggal) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: 'tanggal is required'
            });
        }

        let dataPoli = await client.json.get('antrol:dataPoli', '$');
        if (dataPoli === null) {
            dataPoli = await maping_poli_bpjs.findAll();
            client.json.set('antrol:dataPoli', '$', dataPoli);
            client.expire('antrol:dataPoli', 3600);
        }

        let startTime = new Date(); // Record start time
        let jadwalDr = await client.json.get(`antrol:jadwalDr:${req.query.tanggal}`, '$');
        if (jadwalDr === null) {
            let jadwal_Dr = [];
            for (let x of dataPoli) {
                let jadwal = await axios.get(url_bpjs + `/api/bpjs/antrean/jadwaldokter?tanggal=${req.query.tanggal}&kd_poli_BPJS=${x.kd_poli_bpjs}`);
                if (jadwal.data.metadata.code === 200) {
                    jadwal_Dr = jadwal_Dr.concat(jadwal.data.response);
                }
            }
            client.json.set(`antrol:jadwalDr:${req.query.tanggal}`, '$', jadwal_Dr);
            client.expire(`antrol:jadwalDr:${req.query.tanggal}`, 3600);
            jadwalDr = jadwal_Dr;
        }
        let endTime = new Date();

        // Calculate response time
        let responseTime = endTime - startTime;

        // Output response time
        console.log('Response time jadwal dokter :', responseTime, 'milliseconds');

        let pxTidakLengkap = [];
        let dataAntrol = [];
        let logAntrol = [];
        let noRM = [];
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
                console.log(error);

            }

            for (let x of dataSEP) {
                let startTime = new Date();
                let dataPx = await client.json.get(`antrol:dataPx:${x.noKartu}`, '$');
                if (dataPx === null) {
                    dataPx = await axios.get(url_bpjs + `/api/bpjs/peserta/nokartu?nik=${x.noKartu}&tglSEP=${req.query.tanggal}`);
                    x.dataPx = dataPx.data.response;
                    client.json.set(`antrol:dataPx:${x.noKartu}`, '$', dataPx.data.response);
                    client.expire(`antrol:dataPx:${x.noKartu}`, 3600);
                } else {
                    console.log('cache');
                    x.dataPx = dataPx;
                }

                if (x.dataPx.peserta.mr.noMR === null) {
                    pxTidakLengkap.push(x);
                } else {
                    noRM.push(x.dataPx.peserta.mr.noMR);
                }

                let endTime = new Date();
                let responseTime = endTime - startTime;
                // Output response time
                console.log('Response time nokartu :', responseTime, 'milliseconds');
            }
            const reg_px = await reg_periksa.findAll({
                where: {
                    [Op.and]: [
                        { tgl_registrasi: req.query.tanggal },
                        { no_rkm_medis: noRM }
                    ],
                },
                attributes: ['kd_dokter', 'jam_reg', 'tgl_registrasi', 'no_reg', 'stts_daftar', 'no_rawat', 'no_rkm_medis'],
            });

            if (reg_px === null) {
                pxTidakLengkap.push(x);
            }
            // gabungkan dalam dataSEP bedasrakan noRM
            for (let x of dataSEP) {
                x.reg_px = reg_px.find(item => item.no_rkm_medis === x.dataPx.peserta.mr.noMR);
            }
            dataSEP = dataSEP.filter(item => item.reg_px !== null);

            for (let x of dataSEP) {
                // let reg_px = reg_px.find(item => item.no_rkm_medis === x.dataPx.peserta.mr.noMR);
                try {

                    let nomorSEP = await client.json.get(`antrol:nomorSEP:${x.noSep}`,);
                    if (nomorSEP === null) {
                        let data_nomorSEP = await axios.get(url_bpjs + `/api/bpjs/sep?noSEP=${x.noSep}`);
                        nomorSEP = data_nomorSEP.data.response;
                        client.json.set(`antrol:nomorSEP:${x.noSep}`, '$', nomorSEP);
                        client.expire(`antrol:nomorSEP:${x.noSep}`, 3600 * 48);

                    }

                    let data_poli = dataPoli.find(item => item.nm_poli_bpjs === nomorSEP.poli);
                    let jadwaldrPoli = jadwalDr.find(x => x.kodedokter === parseInt(nomorSEP.dpjp.kdDPJP));
                    let jamReg = new Date(x.reg_px.tgl_registrasi + ' ' + x.reg_px.jam_reg);
                    jamReg.setTime(jamReg.getTime() + 10 * 60 * 1000);
                    let nohp = x.dataPx.peserta.mr.noTelepon;

                    if (nohp.length >= 13) {
                        console.log(nohp);
                        nohp = '000000000000';
                    }
                    if (nohp === null) {
                        nohp = '000000000000';
                    }

                    let addAntrol = {
                        "kodebooking": x.reg_px.no_rawat,
                        "jenispasien": "JKN",
                        "nomorkartu": x.noKartu,
                        "nik": x.dataPx.peserta.nik,
                        "nohp": nohp,
                        "kodepoli": data_poli.kd_poli_bpjs,
                        "namapoli": nomorSEP.poli,
                        "pasienbaru": x.reg_px.stts_daftar === 'Baru' ? 1 : 0,
                        "norm": x.dataPx.peserta.mr.noMR,
                        "tanggalperiksa": req.query.tanggal,
                        "kodedokter": parseInt(nomorSEP.dpjp.kdDPJP),
                        "namadokter": nomorSEP.dpjp.nmDPJP,
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
                    let startTime = new Date();

                    axios.post(url_bpjs + '/api/bpjs/antrean/add', addAntrol)
                        .then(response => {
                            if (response.data.metadata.code === 201) {
                                logAntrol.push(addAntrol);
                                logAntrol.push(response.data);
                            }
                            if (response.data.metadata.code === 200) {
                                logAntrol.push(addAntrol);
                                logAntrol.push(response.data);
                                dataAntrol.push(addAntrol);
                            }
                            if (response.data.metadata.code === 208) {
                                logAntrol.push(addAntrol);
                                logAntrol.push(response.data);
                                dataAntrol.push(addAntrol);
                            }
                        })
                    let endTime = new Date();
                    let responseTime = endTime - startTime;
                    // Output response time
                    console.log('Response time add antrean :', responseTime, 'milliseconds');
                } catch (error) {
                    console.error(error);
                }

            }

            fs.writeFileSync('./cache/' + `antrol${req.query.tanggal}.json`, JSON.stringify(dataAntrol));
            fs.writeFileSync('./cache/' + `logAntrol${req.query.tanggal}.json`, JSON.stringify(logAntrol));
            return res.status(200).json({
                status: false,
                message: 'Success',
                record: dataSEP.length,
                datadataAntrol: dataAntrol.length,
                dataAntrol,
                pxTidakLengkap,
                dataSEP,
                // pxTidakLengkap: pxTidakLengkap.length,
                // dataAntrol,
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
    },
    test: async (req, res) => {

        // let data = await client.json.get('noderedis:jsondata', '$');
        // if (data === null) {
        // data = await maping_poli_bpjs.findAll();
        // data get body from request
        let data = req.body;
        //  client.json.set('noderedis:jsondata', '3', data);
        let hasil = await client.json.del('noderedis:', 'sa:jsondata');
        return res.status(200).json({
            status: false,
            message: 'Success',
            data,
            hasil

        });
    },
}
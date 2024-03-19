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
            client.expire('antrol:dataPoli', 3600 * 24);
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
            client.expire(`antrol:jadwalDr:${req.query.tanggal}`, 60 * 60 * 24);
            jadwalDr = jadwal_Dr;
        }
        let endTime = new Date();

        // Calculate response time
        let responseTime = endTime - startTime;

        // Output response time
        console.log('Response time jadwal dokter :', responseTime, 'milliseconds');

        let tagg = 0;
        let dataAntrol = [];
        let logAntrol = [];
        let dataAntrolCache 
        try {
            let sepTerbit = await axios.get(url_bpjs + `/api/bpjs/monitoring/kunjungan?from=${req.query.tanggal}&until=${req.query.tanggal}&pelayanan=2`);
            let dataSEP = sepTerbit.data.response.data;
            // filter dataSEP yang poli nya IGD
            dataSEP = dataSEP.filter(item => item.poli !== 'IGD');
            dataSEP = dataSEP.filter(item => item.poli !== 'HDL');

            // if fs cache antrol.json exist
            if (fs.existsSync('./cache/' + `antrol${req.query.tanggal}.json`)) {
                // filter dari fs antrol.json
                dataAntrolCache = fs.readFileSync('./cache/' + `antrol${req.query.tanggal}.json`, 'utf8');
                dataAntrolCache = JSON.parse(dataAntrolCache);
                let dataAntrolCacheMap = dataAntrolCache.map(item => item.nomorkartu);
                dataSEP = dataSEP.filter(item => !dataAntrolCacheMap.includes(item.noKartu));
                tagg = 1;
            }
            for (let x of dataSEP) {
                let startTime = new Date();
                let dataPx = await client.json.get(`antrol:dataPx:${x.noKartu}`, '$');
                if (dataPx === null) {
                    dataPx = await axios.get(url_bpjs + `/api/bpjs/peserta/nokartu?nik=${x.noKartu}&tglSEP=${req.query.tanggal}`);
                    x.dataPx = dataPx.data.response;
                    client.json.set(`antrol:dataPx:${x.noKartu}`, '$', dataPx.data.response);
                    client.expire(`antrol:dataPx:${x.noKartu}`, 60 * 60 * 24 * 7);
                } else {
                    console.log('cache');
                    x.dataPx = dataPx;
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
                        { no_rkm_medis: dataSEP.map(item => item.dataPx.peserta.mr.noMR) }
                    ],
                },
                include: [
                    {
                        model: maping_dokter_dpjpvclaim,
                        as: 'maping_dokter_dpjpvclaim',
                    },
                    {
                        model: maping_poli_bpjs,
                        as: 'maping_poli_bpjs',
                    }
                ],
                attributes: ['kd_dokter', 'kd_poli', 'jam_reg', 'tgl_registrasi', 'no_reg', 'stts_daftar', 'no_rawat', 'no_rkm_medis'],
            });
            let combain = reg_px.map(item => ({
                ...item.dataValues,
                ...dataSEP.find(dataItem => dataItem.dataPx.peserta.mr.noMR === item.no_rkm_medis),
            }));

            for (let x of combain) {
                try {
                    let jamReg = new Date(x.tgl_registrasi + ' ' + x.jam_reg);
                    jamReg.setTime(jamReg.getTime() + 10 * 60 * 1000);
                    let nohp = x.dataPx.peserta.mr.noTelepon;
                    let jadwaldrPoli = jadwalDr.find(dataItem => dataItem.kodedokter === parseInt(x.maping_dokter_dpjpvclaim.kd_dokter_bpjs));
                    if (nohp.length >= 13) {
                        nohp = '000000000000';
                    }
                    if (nohp === null) {
                        nohp = '000000000000';
                    }
                    let addAntrol = {
                        "kodebooking": x.no_rawat,
                        "jenispasien": "JKN",
                        "nomorkartu": x.dataPx.peserta.noKartu,
                        "nik": x.dataPx.peserta.nik,
                        "nohp": nohp,
                        "kodepoli": x.maping_poli_bpjs.kd_poli_bpjs,
                        "namapoli": x.maping_poli_bpjs.nm_poli_bpjs,
                        "pasienbaru": x.stts_daftar === 'Baru' ? 1 : 0,
                        "norm": x.no_rkm_medis,
                        "tanggalperiksa": req.query.tanggal,
                        "kodedokter": parseInt(x.maping_dokter_dpjpvclaim.kd_dokter_bpjs),
                        "namadokter": x.maping_dokter_dpjpvclaim.nm_dokter_bpjs,
                        "jampraktek": jadwaldrPoli.jadwal,
                        "jeniskunjungan": 3,
                        "nomorreferensi": x.noRujukan,
                        "nomorantrean": `${x.poli}-${x.no_reg}`,
                        "angkaantrean": parseInt(x.no_reg),
                        "estimasidilayani": jamReg.getTime(),
                        "sisakuotajkn": jadwaldrPoli.kapasitaspasien - parseInt(x.no_reg),
                        "kuotajkn": jadwaldrPoli.kapasitaspasien,
                        "sisakuotanonjkn": jadwaldrPoli.kapasitaspasien - parseInt(x.no_reg),
                        "kuotanonjkn": jadwaldrPoli.kapasitaspasien,
                        "keterangan": "Peserta harap 20 menit lebih awal guna pencatatan administrasi."
                    }

                    let startTime = new Date();
                    let postAntrol = await axios.post(url_bpjs + '/api/bpjs/antrean/add', addAntrol);
                    if (postAntrol.data.metadata.code === 201) {
                        logAntrol.push(addAntrol);
                        logAntrol.push(postAntrol.data);
                    }
                    if (postAntrol.data.metadata.code === 200) {
                        logAntrol.push(addAntrol);
                        logAntrol.push(postAntrol.data);
                        if (tagg === 1) {
                            dataAntrolCache.push(addAntrol);
                        } else {
                            dataAntrol.push(addAntrol);
                        }
                    }
                    if (postAntrol.data.metadata.code === 208) {
                        logAntrol.push(addAntrol);
                        logAntrol.push(postAntrol.data);
                        if (tagg === 1) {
                            dataAntrolCache.push(addAntrol);
                        } else {
                            dataAntrol.push(addAntrol);
                        }
                    }
                    let endTime = new Date();

                    // Calculate response time
                    let responseTime = endTime - startTime;

                    // Output response time
                    console.log('Response time antrean add :', responseTime, 'milliseconds');
                } catch (error) {
                    console.error(error);
                    logAntrol.push(addAntrol);
                    logAntrol.push(error);

                }
            }

            if (tagg === 1) {
                fs.writeFileSync('./cache/' + `antrol${req.query.tanggal}.json`, JSON.stringify(dataAntrolCache));
            } else {
                fs.writeFileSync('./cache/' + `antrol${req.query.tanggal}.json`, JSON.stringify(dataAntrol));
            }
            fs.writeFileSync('./cache/' + `logAntrol${req.query.tanggal}.json`, JSON.stringify(logAntrol));
            return res.status(200).json({
                status: false,
                message: 'Success',
                record: combain.length,
                dataAntrolLength: dataAntrol.length,
                data: dataAntrol,
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
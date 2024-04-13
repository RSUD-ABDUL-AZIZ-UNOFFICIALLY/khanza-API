'use strict';
require('dotenv').config();
const { Op } = require("sequelize");
const axios = require('axios');
const { reg_periksa, pasien, bridging_sep, maping_poli_bpjs, maping_dokter_dpjpvclaim } = require('../models');

const { createClient } = require('redis');
const url_bpjs = process.env.URL_BPJS;

const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_URL_PORT
    }
});
client.connect();
// client.on('connect', () => {
//     console.log('Redis client connected');
// });
// client.on('error', (err) => {
//     console.log('Something went wrong ' + err);
// });
// client.json.arrAppend('noderedis:jsondata', '$', { 'foo': 'caa' });
async function getMappingPoliklinik() {
    let dataPoli = await client.json.get('antrol:mapping:poli', '$');
    if (!dataPoli) {
        dataPoli = await maping_poli_bpjs.findAll();
        client.json.set('antrol:mapping:poli', '$', dataPoli);
        client.expire('antrol:mapping:poli', 3600 * 24 * 12);
    }
    return dataPoli;
}
async function jadwalDr(tanggal) {
    let jadwalDr = await client.json.get(`antrol:${tanggal}:jadwalDr`, '$');
    let dataPoli = await getMappingPoliklinik();
    if (jadwalDr === null) {
        let jadwal_Dr = [];
        for (let x of dataPoli) {
            let jadwal = await axios.get(url_bpjs + `/api/bpjs/antrean/jadwaldokter?tanggal=${tanggal}&kd_poli_BPJS=${x.kd_poli_bpjs}`);
            if (jadwal.data.metadata.code === 200) {
                jadwal_Dr = jadwal_Dr.concat(jadwal.data.response);
            }
        }
        client.json.set(`antrol:${tanggal}:jadwalDr`, '$', jadwal_Dr);
        client.expire(`antrol:${tanggal}:jadwalDr`, 60 * 60 * 24);
        jadwalDr = jadwal_Dr;
    }
    return jadwalDr;
}

// jadwalDr('2024-04-01')
// sepTerbit('2024-04-01')

async function sepTerbit(tanggal) {
    // axios.get(url_bpjs + `/api/bpjs/monitoring/kunjungan?from=${tanggal}&until=${tanggal}&pelayanan=2`).then(function (response) {
    //     console.log(response.data);
    //     let dataSEP = response.data;
    //     console.log(dataSEP);
    // });
    let sepTerbit = await axios.get(url_bpjs + `/api/bpjs/monitoring/kunjungan?from=${tanggal}&until=${tanggal}&pelayanan=2`);
    let dataSEP = sepTerbit.data.response.data;
    dataSEP = dataSEP.filter(item => item.poli !== 'IGD');
    dataSEP = dataSEP.filter(item => item.poli !== 'HDL');
    return dataSEP;
}

async function identas(tanggal, nokartu) {
    let dataPx = await client.json.get(`antrol:${tanggal}:noka:${nokartu}`, '$');
    if (dataPx === null) {
        dataPx = await axios.get(url_bpjs + `/api/bpjs/peserta/nokartu?nik=${nokartu}&tglSEP=${tanggal}`);
        dataPx = dataPx.data.response;
        client.json.set(`antrol:${tanggal}:noka:${nokartu}`, '$', dataPx);
        client.expire(`antrol:${tanggal}:noka:${nokartu}`, 60 * 60 * 24);
    }
    return dataPx;
}

async function getRegisPeriksa(tanggal, norm) {
    let dataRegis = await reg_periksa.findAll({
        where: {
            [Op.and]: [
                { tgl_registrasi: tanggal },
                // { no_rkm_medis: norm },
                { status_lanjut: 'Ralan' },
                { [Op.ne]: [{ kd_poli: ['IGDK', 'U003'] }] }
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
            },
            {
                model: bridging_sep,
                as: 'bridging_sep',
                where: {
                    jnspelayanan: '2'
                }
            },
            {
                model: pasien,
                as: 'pasien',
            }
        ],
        attributes: ['kd_dokter', 'kd_poli', 'jam_reg', 'tgl_registrasi', 'no_reg', 'stts_daftar', 'no_rawat', 'no_rkm_medis'],
    });
    console.log(dataRegis.length);
    client.json.set(`antrol:${tanggal}:regis`, '$', dataRegis);
    return dataRegis;
}
// sepTerbit('2024-04-01')
// identas('2024-04-01', '0001477606702')
getRegisPeriksa('2024-04-01', ['119806', '146210'])

async function addAntrol(tanggal) {
    let dataSEPTerbit = await sepTerbit(tanggal);
    let noKartus = dataSEPTerbit.map(item => item.noKartu);
    let dataJadwaldr = jadwalDr(tanggal);
    let noRMs = [];
    for (let x of noKartus) {
        let dataPx = await identas(tanggal, x);
        noRMs.push(dataPx.peserta.mr.noMR);
    }
    console.log(noRMs.length);
    console.log(dataSEPTerbit.length);
    let dataRegis = await getRegisPeriksa(tanggal, noRMs);
    console.log(dataRegis.length);
    // await client.json.set('noderedis:jsondata', '$', noKartu);
    // client.expire(`noderedis:jsondata`, 60);
    // let dataPx = await identas(tanggal, noKartu);

}
// addAntrol('2024-04-01');
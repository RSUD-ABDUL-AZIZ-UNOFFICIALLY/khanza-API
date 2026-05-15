'use strict';
const {  kamar_inap} = require('../models');
const { Op } = require("sequelize");

async function getbedinfo(periode, kd_kamar) {
     let [year, month] = periode.split('-');
        if (!year || !month) {
            return res.status(400).json({
                status: false,
                message: "Bad Request",
                data: "required field: periode: yyyy-mm",
            });
        }
    let jumlah_hari = new Date(year, month, 0).getDate();
        let dateDump = [];
        try {
          
            let dataBOR = await kamar_inap.findAll({
                where: {
                    tgl_masuk: { [Op.between]: [year + "-" + month + "-01", year + "-" + month + "-" + jumlah_hari] },
                    kd_kamar: kd_kamar,
                },
                attributes: ['tgl_masuk', 'tgl_keluar', 'kd_kamar', 'lama','stts_pulang'],
                order: [
                    ['tgl_masuk', 'ASC']
                ]
            });
            for (let x of dataBOR) {
                let tglMasuk = x.tgl_masuk.split('-');
                let tglKeluar = x.tgl_keluar.split('-');
                if (parseInt(tglKeluar[2]) < parseInt(tglMasuk[2])) {
                    console.log(x);
                    for (let i = parseInt(tglMasuk[2]); i <= parseInt(jumlah_hari); i++) {
                        dateDump.push(`${tglMasuk[0]}-${tglMasuk[1]}-${i < 10 ? '0' + i : i}`);
                    }
                } else {
                    for (let i = parseInt(tglMasuk[2]); i <= parseInt(tglKeluar[2]); i++) {
                        dateDump.push(`${year}-${month}-${i < 10 ? '0' + i : i}`);
                    }
                }
            }
            if (dataBOR[0].tgl_masuk !== `${year}-${month}-01`) {
                let tanggalSebelum = new Date(`${year}-${month}-01`);
                tanggalSebelum.setDate(tanggalSebelum.getDate() - 30);
                let sebelum = tanggalSebelum.toISOString().split('T')[0];
                let downtime = await kamar_inap.findAll({
                    where: {
                        tgl_masuk: { [Op.between]: [`${sebelum}`, dataBOR[0].tgl_masuk] },
                        kd_kamar: kd_kamar,
                    },
                    attributes: ['tgl_masuk', 'tgl_keluar', 'kd_kamar', 'lama','stts_pulang'],
                    order: [
                        ['tgl_masuk', 'ASC']
                    ]
                })
                for (let x of downtime) {
                    let tglMasuk = x.tgl_masuk.split('-');
                    let tglKeluar = x.tgl_keluar.split('-');
                    if (parseInt(tglKeluar[2]) < parseInt(tglMasuk[2])) {
                        console.log(x);
                        dataBOR.push(x);
                        for (let i = 1; i <= parseInt(tglKeluar[2]); i++) {
                            dateDump.push(`${tglKeluar[0]}-${tglKeluar[1]}-${i < 10 ? '0' + i : i}`);
                        }

                    }

                }
            }
            

            let uniqueDates = new Set(dateDump);
            dateDump = Array.from(uniqueDates);
            let mapslama = dataBOR.map(x => x.lama);
            let totalLama = mapslama.reduce((a, b) => a + b, 0);
            return ({
                preriode_hari: jumlah_hari,
                hari_perawatan: dateDump.length,
                total_lama: totalLama,
                avlos: totalLama / dataBOR.length,
                Pasien_Keluar: dataBOR.length,
                // length: dateDump,
                data: dataBOR,
            });
        } catch (err) {
            console.log(err);
            return err;
        }    
}

module.exports = {
    getbedinfo
}
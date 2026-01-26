'use strict';
const { reg_periksa, bridging_sep, maping_dokter_dpjpvclaim, pasien, dokter, penjab, poliklinik, maping_poli_bpjs, sequelize, booking_registrasi, jadwal } = require('../models');
const { Op, where } = require("sequelize");
const { getCurrentTime } = require('../helpers');
module.exports = {
    bookingPeriksa: async (req, res) => {
        try {
            const { no_rkm_medis, tanggal_periksa, kd_dokter, kd_poli, kd_pj } = req.body;
            if (!no_rkm_medis || !tanggal_periksa || !kd_dokter || !kd_poli || !kd_pj) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "No RM Medis, Tanggal Periksa, Kode Dokter, Kode Poli, Kode Penjab, dan Waktu Kunjungan harus diisi",
                });
            }
            const dataPasien = await pasien.findOne({
                where: {
                    no_rkm_medis,
                },
            });
            if (!dataPasien) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "No RM Medis tidak ditemukan",
                });
            }
            let cekReg = await reg_periksa.findOne({
                where: {
                    no_rkm_medis,
                    tgl_registrasi: tanggal_periksa,
                },
            });
            if (cekReg) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Pasien sudah melakukan registrasi",
                });
            }
            let cekNoRegBooking = await booking_registrasi.findOne({
                where: {
                    tanggal_periksa,
                    kd_poli,
                },
                order: [
                    ['no_reg', 'DESC'],
                ],
            });
            let no_regBooking = '001';
            if (cekNoRegBooking) {
                no_regBooking = String(Number(no_regBooking) + Number(cekNoRegBooking.no_reg)).padStart(no_regBooking.length, '0');
            }
            let cekNoReg = await reg_periksa.findOne({
                where: {
                    tgl_registrasi: tanggal_periksa,
                    kd_poli,
                },
                order: [
                    ['no_reg', 'DESC'],
                ],
            });
            let no_reg = '001';
            if (cekNoReg) {
                no_reg = String(Number(no_reg) + Number(cekNoReg.no_reg)).padStart(no_reg.length, '0');
            }
            // bandingkan no_reg dan no_regBooking jika no_regBooking lebih besar maka no_reg = no_regBooking
            if (Number(no_regBooking) > Number(no_reg)) {
                no_reg = no_regBooking;
            }
            let currentTime = getCurrentTime();
            let data = {
                tanggal_booking: `${currentTime.year}-${currentTime.month}-${currentTime.day}`,
                jam_booking: `${currentTime.hours}:${currentTime.minutes}:${currentTime.seconds}`,
                no_rkm_medis,
                tanggal_periksa,
                kd_dokter,
                kd_poli,
                no_reg,
                kd_pj,
                limit_reg: 0,
                waktu_kunjungan: `${tanggal_periksa} ${currentTime.hours}:${currentTime.minutes}:${currentTime.seconds}`,
                status: 'Belum',
            }
            let dataBooking = await booking_registrasi.findOne({
                where: {
                    no_rkm_medis: no_rkm_medis,
                    tanggal_periksa: tanggal_periksa,
                },
            });
            if (dataBooking) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Pasien sudah melakukan booking",
                });
            }
            let booking = await booking_registrasi.create(data);
            return res.status(200).json({
                status: true,
                message: "success",
                data: data,
                // booking
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    cekBookingPeriksa: async (req, res) => {
        try {
            const { no_rkm_medis } = req.query;
            if (!no_rkm_medis) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "No RM Medis harus diisi",
                });
            }
            let dataBooking = await booking_registrasi.findAll({
                where: {
                    no_rkm_medis: no_rkm_medis,
                    tanggal_periksa: {
                        [Op.gte]: new Date(),
                    }
                },
                include: [
                    {
                        model: pasien,
                        as: 'pasien',
                        attributes: ['nm_pasien', 'no_rkm_medis', 'tgl_lahir', 'jk', 'no_ktp', 'no_peserta']
                    },
                    {
                        model: dokter,
                        as: 'dokter',
                        attributes: ['nm_dokter', 'no_ijn_praktek']
                    },
                    {
                        model: poliklinik,
                        as: 'poliklinik',
                        attributes: ['nm_poli']
                    },
                    {
                        model: penjab,
                        as: 'penjab',
                        attributes: ['png_jawab']
                    }
                ],
            });
            console.log(dataBooking);
            if (dataBooking.length < 1) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Pasien tidak ada melakukan booking",
                });
            }
            return res.status(200).json({
                status: true,
                message: "success",
                data: dataBooking,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    batalBookingPeriksa: async (req, res) => {
        try {
            const { no_rkm_medis, tanggal_periksa } = req.body;
            if (!no_rkm_medis || !tanggal_periksa) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "No RM Medis dan Tanggal Periksa harus diisi",
                });
            }
            let dataBooking = await booking_registrasi.findOne({
                where: {
                    no_rkm_medis: no_rkm_medis,
                    tanggal_periksa: tanggal_periksa
                },
            });
            if (!dataBooking) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Booking tidak ditemukan",
                });
            }
            if (dataBooking.status === 'Batal') {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Booking sudah dibatalkan silahkan konfirmasi ke bagian pendaftaran",
                });
            }
            await booking_registrasi.update(
                { status: 'Batal' }, {
                where: {
                    no_rkm_medis: no_rkm_medis,
                    tanggal_periksa: tanggal_periksa,
                },
            });
            return res.status(200).json({
                status: true,
                message: "success",
                data: "Booking berhasil dibatalkan"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    cekinBookingPeriksa: async (req, res) => {
        try {
            const { no_rkm_medis, tanggal_periksa, p_jawab, almt_pj, hubunganpj } = req.body;
            if (!no_rkm_medis || !tanggal_periksa) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "No RM Medis dan Tanggal Periksa harus diisi",
                });
            }
            let dataBooking = await booking_registrasi.findOne({
                where: {
                    no_rkm_medis: no_rkm_medis,
                    tanggal_periksa: tanggal_periksa
                },
            });
            if (!dataBooking) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Booking tidak ditemukan",
                });
            }
            if (dataBooking.status === 'Batal') {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Booking sudah dibatalkan silahkan konfirmasi ke bagian pendaftaran",
                });
            }
            let cekReg = await reg_periksa.findOne({
                where: {
                    no_rkm_medis,
                    tgl_registrasi: tanggal_periksa,
                },
            });
            if (cekReg) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Pasien sudah melakukan registrasi",
                });
            }
            let dataPasien = await pasien.findOne({
                where: {
                    no_rkm_medis,
                },
            });
            const t = await sequelize.transaction();
            try {
                let stt_poli = await reg_periksa.findOne({
                    where: {
                        no_rkm_medis,
                        kd_poli: dataBooking.kd_poli,
                    },
                    attributes: ['status_poli'],
                });
                let noRawatLast = await reg_periksa.findOne({
                    where: {
                        tgl_registrasi: tanggal_periksa,
                    },
                    order: [
                        ['no_rawat', 'DESC'],
                    ],
                    attributes: ['no_rawat'],
                });
                let no_rawat;
                let nomorRawaLast = tanggal_periksa.split('-');
                if (!noRawatLast) {
                    no_rawat = `${nomorRawaLast[0]}/${nomorRawaLast[1]}/${nomorRawaLast[2]}/000001`;
                } else {
                    let nomorRawaLastSplit = noRawatLast.no_rawat.split('/');
                    let nomorRawaLastSplit5 = Number(nomorRawaLastSplit[3]) + 1;
                    no_rawat = `${nomorRawaLastSplit[0]}/${nomorRawaLastSplit[1]}/${nomorRawaLastSplit[2]}/${String(nomorRawaLastSplit5).padStart(6, '0')}`;
                }
                let status_poli = '';
                if (stt_poli) {
                    status_poli = 'Lama';
                } else {
                    status_poli = 'Baru';
                }
                await booking_registrasi.update(
                    { status: 'Terdaftar' }, {
                    where: {
                        no_rkm_medis: no_rkm_medis,
                        tanggal_periksa: tanggal_periksa,
                        },
                }, { transaction: t });
                await reg_periksa.create({
                    no_reg: dataBooking.no_reg,
                    no_rawat: no_rawat,
                    tgl_registrasi: tanggal_periksa,
                    jam_reg: dataBooking.jam_booking,
                    kd_dokter: dataBooking.kd_dokter,
                    no_rkm_medis: dataBooking.no_rkm_medis,
                    kd_poli: dataBooking.kd_poli,
                    p_jawab: p_jawab,
                    almt_pj: almt_pj,
                    hubunganpj: hubunganpj,
                    biaya_reg: 0,
                    stts: 'Belum',
                    stts_daftar: 'Lama',
                    status_lanjut: 'Ralan',
                    kd_pj: dataBooking.kd_pj,
                    umurdaftar: 0,
                    sttsumur: 'Th',
                    status_poli: 'Baru',
                }, { transaction: t });
                await t.commit();
            } catch (error) {
                await t.rollback();
                console.log(error);
                return res.status(400).json({
                    error: true,
                    message: "error",
                    data: error.message,
                });
            }

            return res.status(200).json({
                status: true,
                message: "success",
                data: "Booking berhasil di cekin"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    getJadwal: async (req, res) => {
        try {
            const { kd_poli, tanggal_periksa } = req.query;
            if (!kd_poli || !tanggal_periksa) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Kode Poli dan Tanggal Periksa harus diisi",
                });
            }
            let dateObject = new Date(tanggal_periksa);
            let namaHari = dateObject.toLocaleDateString('id-ID', { weekday: 'long' });
            let dataJadwal = await jadwal.findAll({
                where: {
                    kd_poli: kd_poli,
                    hari_kerja: namaHari,
                },
                include: [
                    {
                        model: dokter,
                        as: 'dokter',
                        // attributes: ['nm_dokter'],
                    },
                ],


            });
            if (!dataJadwal) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Jadwal tidak ditemukan",
                });
            }

            return res.status(200).json({
                status: true,
                message: "success",
                data: dataJadwal
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    getAllJadwal: async (req, res) => {
        try {
            const { tanggal_periksa } = req.query;
            if (!tanggal_periksa) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Kode Tanggal Periksa harus diisi",
                });
            }
            let dateObject = new Date(tanggal_periksa);
            let namaHari = dateObject.toLocaleDateString('id-ID', { weekday: 'long' });
            console.log(namaHari);
            let dataJadwal = await jadwal.findAll({
                where: {
                    hari_kerja: namaHari
                },
                include: [
                    {
                        model: dokter,
                        as: 'dokter',
                        // attributes: ['nm_dokter'],
                    },
                    {
                        model: poliklinik,
                        as: 'poliklinik',
                        // attributes: ['nm_poli'],
                    },
                ],


            });
            if (!dataJadwal) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Jadwal tidak ditemukan",
                });
            }
            dataJadwal = dataJadwal.map((item) => {
                return {
                    kd_jadwal: item.kd_jadwal,
                    kd_poli: item.kd_poli,
                    kd_dokter: item.kd_dokter,
                    nm_dokter: item.dokter.nm_dokter,
                    hari_kerja: item.hari_kerja,
                    jam_mulai: item.jam_mulai,
                    jam_selesai: item.jam_selesai,
                    nm_poli: item.poliklinik.nm_poli,
                }
            });

            return res.status(200).json({
                status: true,
                message: "success",
                recoud: dataJadwal.length,
                data: dataJadwal
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    getJadwalBpjs: async (req, res) => {
        try {
            const { kd_poli, tanggal_periksa } = req.query;
            if (!kd_poli || !tanggal_periksa) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "Kode Poli dan Tanggal Periksa harus diisi",
                });
            }
            let dateObject = new Date(tanggal_periksa);
            let namaHari = dateObject.toLocaleDateString('id-ID', { weekday: 'long' });
            let poliBPJS = await maping_poli_bpjs.findOne({
                where: {
                    kd_poli_bpjs: kd_poli
                },
                attributes: ['kd_poli_rs']

            })
            console.log(poliBPJS);
            let dataJadwal = await jadwal.findAll({
                where: {
                    kd_poli: poliBPJS.dataValues.kd_poli_rs,
                    hari_kerja: namaHari,
                },
                include: [
                    {
                        model: dokter,
                        as: 'dokter',
                        // attributes: ['nm_dokter'],
                    },
                ],


            });
            if (!dataJadwal) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Jadwal tidak ditemukan",
                });
            }

            return res.status(200).json({
                status: true,
                message: "success",
                data: dataJadwal
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    getAsuransi: async (req, res) => {
        try {
            let dataAsuransi = await penjab.findAll({
                where: {
                    status: '1',
                },
            });
            if (!dataAsuransi) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Asuransi tidak ditemukan",
                });
            }

            return res.status(200).json({
                status: true,
                message: "success",
                data: dataAsuransi
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    postRegistrasi: async (req, res) => {
        try {
            const { no_rkm_medis, tanggal_periksa, kd_poli, jam_reg, kd_dokter, kd_pj } = req.body;
            if (!no_rkm_medis || !tanggal_periksa) {
                return res.status(400).json({
                    status: false,
                    message: "Bad Request",
                    data: "No RM Medis dan Tanggal Periksa harus diisi",
                });
            }
            let cekReg = await reg_periksa.findOne({
                where: {
                    no_rkm_medis,
                    tgl_registrasi: tanggal_periksa,
                },
            });
            if (cekReg) {
                return res.status(200).json({
                    status: true,
                    message: "success",
                    data: {
                        no_rawat: cekReg.no_rawat,
                        no_reg: cekReg.no_reg,
                        no_rkm_medis: cekReg.no_rkm_medis
                    }
                });
            }
            let dataPasien = await pasien.findOne({
                where: {
                    no_rkm_medis,
                },
            });
            const t = await sequelize.transaction();
            try {
                let stt_poli = await reg_periksa.findOne({
                    where: {
                        no_rkm_medis,
                        kd_poli,
                    },
                    attributes: ['status_poli'],
                });
                let noRawatLast = await reg_periksa.findOne({
                    where: {
                        tgl_registrasi: tanggal_periksa,
                    },
                    order: [
                        ['no_rawat', 'DESC'],
                    ],
                    attributes: ['no_rawat'],
                });
                let noPoliLast = await reg_periksa.findOne({
                    where: {
                        tgl_registrasi: tanggal_periksa,
                        kd_poli
                    },
                    order: [
                        ['no_reg', 'DESC'],
                    ],
                    attributes: ['no_reg'],
                });
                console.log(noPoliLast);
                let no_antrian = '';
                if (!noPoliLast) {
                    no_antrian = '001';
                } else {
                    no_antrian = (parseInt(noPoliLast.no_reg, 10) + 1).toString().padStart(noPoliLast.no_reg.length, "0")
                }
                let no_rawat;
                let nomorRawaLast = tanggal_periksa.split('-');
                if (!noRawatLast) {
                    no_rawat = `${nomorRawaLast[0]}/${nomorRawaLast[1]}/${nomorRawaLast[2]}/000001`;
                } else {
                    let nomorRawaLastSplit = noRawatLast.no_rawat.split('/');
                    let nomorRawaLastSplit5 = Number(nomorRawaLastSplit[3]) + 1;
                    no_rawat = `${nomorRawaLastSplit[0]}/${nomorRawaLastSplit[1]}/${nomorRawaLastSplit[2]}/${String(nomorRawaLastSplit5).padStart(6, '0')}`;
                }
                let status_poli = '';
                if (stt_poli) {
                    status_poli = 'Lama';
                } else {
                    status_poli = 'Baru';
                }
                let tanggalLahir = new Date(dataPasien.tgl_lahir);
                let tanggalDaftar = new Date(tanggal_periksa);
                let umurdaftar = Math.floor((tanggalDaftar - tanggalLahir) / (1000 * 60 * 60 * 24 * 365.25));


                await reg_periksa.create({
                    no_reg: no_antrian,
                    no_rawat: no_rawat,
                    tgl_registrasi: tanggal_periksa,
                    jam_reg: jam_reg,
                    kd_dokter: kd_dokter,
                    no_rkm_medis: no_rkm_medis,
                    kd_poli: kd_poli,
                    p_jawab: dataPasien.namakeluarga,
                    almt_pj: dataPasien.alamatpj,
                    hubunganpj: dataPasien.keluarga,
                    biaya_reg: 0,
                    stts: 'Belum',
                    stts_daftar: 'Lama',
                    status_lanjut: 'Ralan',
                    kd_pj: kd_pj,
                    umurdaftar: umurdaftar,
                    sttsumur: 'Th',
                    status_poli: status_poli,
                    status_bayar: "Belum Bayar"
                }, { transaction: t });
                await t.commit();
                return res.status(200).json({
                    status: true,
                    message: "success",
                    data: {
                        no_rawat: no_rawat,
                        no_reg: no_antrian,
                        no_rkm_medis: no_rkm_medis,
                        umurdaftar: umurdaftar,
                    }
                });
            } catch (error) {
                await t.rollback();
                console.log(error);
                return res.status(400).json({
                    error: true,
                    message: "error",
                    data: error.message,
                });
            }


        }
        catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    },
    dataSEP: async (req, res) => {
        try {
            const { sep } = req.params;
            console.log(sep);
            let dataSEP = await bridging_sep.findOne({
                where: {
                    no_sep: sep,
                },
                attributes: ['no_sep', 'no_rawat', 'tglsep', 'jnspelayanan', 'klsrawat', 'nmpolitujuan', 'nmdiagnosaawal'],
                include: [
                    {
                        model: maping_dokter_dpjpvclaim,
                        as: 'maping_dokter_dpjpvclaim',
                    },
                    {
                        model: pasien,
                        as: 'pasien',
                        attributes: ['nm_pasien', 'tgl_lahir', 'jk', 'no_rkm_medis', 'no_peserta', 'no_ktp', 'no_peserta']
                    }
                ]
            });
            if (!dataSEP) {
                return res.status(404).json({
                    status: false,
                    message: "Not Found",
                    data: "Data SEP tidak ditemukan",
                });
            }
            return res.status(200).json({
                status: true,
                message: "success",
                data: dataSEP
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: false,
                message: "Bad Request",
                data: error,
            });
        }
    }
};
const { callEklaim } = require('../helpers/api');
const { penjab, poliklinik, pasien, dokter, icd10, icd9, penyakit, kategori_penyakit, billing, pemeriksaan_ranap, kamar_inap, dpjp_ranap, bridging_sep, reg_periksa, diagnosa_pasien, prosedur_pasien, sequelize } = require('../models');
const { Op, where } = require("sequelize");
module.exports = {
    ws: async (req, res) => {
        try{
            const body = req.body;
            const data = await callEklaim(body);
          
            return res.status(200).json({
                status: true,
                message: 'Data inacbg',
                data: data
            }
            );
        } catch (err) {
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    ranapdpjp: async (req, res) => {
        try {
            let no_rawat = req.query.no_rawat;
            let getdpjp_ranap = await dpjp_ranap.findAll({
                where: {
                    no_rawat: no_rawat
                },
                attributes: ["kd_dokter"],
                include: {
                    model: dokter,
                    as: 'dokter',
                    attributes: ['nm_dokter']
                }
            })
            let nmDPJP = '';
            if (getdpjp_ranap.length > 0) {
                let arrNmDPJP = [];
                for (let x of getdpjp_ranap) {
                    arrNmDPJP.push(x.dokter.nm_dokter.split(' ')[1]);
                }
                nmDPJP = arrNmDPJP.join(', ');
            }
            let letkamarInap = await kamar_inap.findAll({
                where: {
                    no_rawat: no_rawat
                },
                order: [
                    ['tgl_masuk', 'ASC']
                ]
                // attributes: ["kd_kamar"],
            })
            if (letkamarInap.length == 0) {
                return res.status(403).json({
                    status: true,
                    message: 'Bukan Pasein Ranap',
                    data: letkamarInap
                });
            }
            let tensi = await pemeriksaan_ranap.findAll({
                where: {
                    no_rawat: req.query.no_rawat
                },
            })
            console.log(tensi);
            let hasilTensi = '110/60';
            if (tensi.length > 0) {
                let dataTensi = tensi.map(item => {
                    return {
                        tensi: item.tensi
                    };
                });

                for (let i = 0; i < dataTensi.length; i++) {
                    if (dataTensi[i].tensi != "") {
                        hasilTensi = dataTensi[i].tensi;
                        continue
                    } else {

                    }
                    continue
                }
            }
            if (letkamarInap[letkamarInap.length - 1].tgl_keluar == '0000-00-00') {
                return res.status(403).json({
                    status: true,
                    message: 'Pasien belum pulang',
                    data: letkamarInap
                });
            }
            let sttrawat = {
                tgl_masuk: letkamarInap[0].tgl_masuk,
                tgl_keluar: letkamarInap[letkamarInap.length - 1].tgl_keluar,
                stts_pulang: letkamarInap[letkamarInap.length - 1].stts_pulang
            }

            let prosedur_non_bedah = await billing.findAll({
                attributes: [[sequelize.fn('sum', sequelize.col('totalbiaya')), 'totalbiaya']],
                where: {
                    no_rawat: no_rawat,
                    status: 'Ranap Dokter Paramedis',
                    nm_perawatan: {
                        [Op.notLike]: '%terapi%'
                    }
                },
                group: ['no_rawat'],
                having: {
                    totalbiaya: {
                        [Op.eq]: [sequelize.fn('sum', sequelize.col('totalbiaya')), '0', null]
                    }
                }
            })
            let totalBiayaNonBedah = prosedur_non_bedah.length > 0 ? prosedur_non_bedah[0].totalbiaya : 0;
            let prosedur_bedah = await billing.sum('totalbiaya', {
                where: {
                    no_rawat,
                    status: 'Operasi'
                }
            }) || 0;
            let konsultasi = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Ranap Dokter' }
            }) || 0;

            let keperawatan = await billing.sum('totalbiaya', {
                where: {
                    no_rawat,
                    status: 'Ranap Paramedis'
                }
            })
            if (keperawatan == null) {
                keperawatan = 0;
            }


            // 3. Radiologi
            let radiologi = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Radiologi' }
            }) || 0;

            // 4. Laboratorium
            let laboratorium = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Laborat' }
            }) || 0;

            // 5. Kamar (Billing Kamar + Biaya Registrasi)
            const billingKamar = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Kamar' }
            }) || 0;

            const dataReg = await reg_periksa.findOne({
                attributes: ['biaya_reg'],
                where: { no_rawat }
            });

            let kamar = parseFloat(billingKamar) + parseFloat(dataReg?.biaya_reg || 0);


            return res.status(200).json({
                status: true,
                message: 'Data dpjp ranap',
                data: {
                    nmDPJP: nmDPJP,
                    sttrawat,
                    getdpjp_ranap,
                    hasilTensi,
                    biaya: {
                        totalBiayaNonBedah,
                        prosedur_bedah,
                        konsultasi,
                        tenaga_ahli: 0,
                        keperawatan,
                        radiologi,
                        laboratorium,
                        kamar


                    }

                }
            });


        } catch (err) {
            console.log(err)
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    },
    bilingRalan: async (req, res) => {
        try {
            let no_rawat = req.query.no_rawat;
            // 1. Prosedur Non Bedah (Ralan & Ranap Dokter Paramedis, exclude 'terapi')
            let prosedur_non_bedah = await billing.findAll({
                attributes: [[sequelize.fn('sum', sequelize.col('totalbiaya')), 'totalbiaya']],
                where: {
                    no_rawat: no_rawat,
                    status: 'Ralan Dokter Paramedis',
                    nm_perawatan: {
                        [Op.notLike]: '%terapi%'
                    }
                },
                group: ['no_rawat'],
                having: {
                    totalbiaya: {
                        [Op.eq]: [sequelize.fn('sum', sequelize.col('totalbiaya')), '0', null]
                    }
                }
            })
            let totalBiayaNonBedah = prosedur_non_bedah.length > 0 ? prosedur_non_bedah[0].totalbiaya : 0;

            // 2. Prosedur Bedah
            let prosedur_bedah = 0;

            // 3. Konsultasi (Ranap & Ralan Dokter)
            let konsultasi = await billing.sum('totalbiaya', {
                where: { no_rawat, status: ['Ranap Dokter', 'Ralan Dokter'] }
            }) || 0;

            // 4. Tenaga Ahli (Hardcoded 0 sesuai source)
            let tenaga_ahli = 0;

            // 5. Keperawatan (Ranap & Ralan Paramedis)
            let keperawatan = await billing.sum('totalbiaya', {
                where: { no_rawat, status: ['Ralan Paramedis'] }
            }) || 0;

            // 6. Radiologi
            let radiologi = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Radiologi' }
            }) || 0;

            // 7. Laboratorium
            let laboratorium = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Laborat' }
            }) || 0;

            const dataReg = await reg_periksa.findOne({
                attributes: ['biaya_reg'],
                where: { no_rawat }
            });
            let kamar = parseFloat(dataReg?.biaya_reg || 0);

            // 9. Obat, Kronis, & Kemoterapi
            let obat_kronis = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Obat', nm_perawatan: { [Op.like]: '%kronis%' } }
            }) || 0;

            let obat_kemoterapi = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Obat', nm_perawatan: { [Op.like]: '%kemo%' } }
            }) || 0;

            let total_obat_raw = await billing.sum('totalbiaya', {
                where: { no_rawat, status: ['Obat', 'Retur Obat', 'Resep Pulang'] }
            }) || 0;

            let obat = parseFloat(total_obat_raw) - parseFloat(obat_kronis) - parseFloat(obat_kemoterapi);

            // 10. BMHP (Tambahan)
            let bmhp = await billing.sum('totalbiaya', {
                where: { no_rawat, status: 'Tambahan' }
            }) || 0;

            // 11. Sewa Alat (Harian & Service)
            let sewa_alat = await billing.sum('totalbiaya', {
                where: { no_rawat, status: ['Harian', 'Service'] }
            }) || 0;

            // 12. Rehabilitasi (Ralan & Ranap Dokter Paramedis, include 'terapi')
            let rehabilitasi = await billing.sum('totalbiaya', {
                where: {
                    no_rawat,
                    status: ['Ralan Dokter Paramedis', 'Ranap Dokter Paramedis'],
                    nm_perawatan: { [Op.like]: '%terapi%' }
                }
            }) || 0;
            return res.status(200).json({
                status: true,
                message: 'Data billing ralan',
                data: {
                    biaya: {
                        totalBiayaNonBedah,
                        prosedur_bedah,
                        konsultasi,
                        tenaga_ahli: 0,
                        keperawatan,
                        radiologi,
                        laboratorium,
                        kamar
                    }
                }
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
    regisList: async (req, res) => {
        try {
            const carabayar = req.query.carabayar || 'bpj';
            const keyword = req.query.keyword || '';
            const tanggalawal = req.query.tanggalawal || '2024-01-01';
            const tanggalakhir = req.query.tanggalakhir || '2024-01-01';
            let status_lanjut = req.query.status_lanjut || 'semua';
            if (status_lanjut == 'semua') {

                status_lanjut = {
                    [Op.in]: [
                        'Ralan',
                        'Ranap'
                    ]
                }
            }
            console.log(status_lanjut);
            const whereConditions = {
                stts: {
                    [Op.ne]: 'Batal'
                },
                tgl_registrasi: {
                    [Op.between]: [
                        `${tanggalawal}`,
                        `${tanggalakhir}`
                    ]
                },
                status_lanjut: status_lanjut
            };

            if (carabayar) {
                whereConditions['$penjab.png_jawab$'] = {
                    [Op.like]: `%${carabayar}%`
                };
            }

            if (keyword) {
                whereConditions[Op.or] = [
                    { no_rawat: { [Op.like]: `%${keyword}%` } },
                    { '$dokter.nm_dokter$': { [Op.like]: `%${keyword}%` } },
                    { no_rkm_medis: { [Op.like]: `%${keyword}%` } },
                    { '$pasien.nm_pasien$': { [Op.like]: `%${keyword}%` } },
                    { '$poliklinik.nm_poli$': { [Op.like]: `%${keyword}%` } },
                    { '$bridging_sep.no_sep$': { [Op.like]: `%${keyword}%` } },
                ];
            }

            const result = await reg_periksa.findAll({
                attributes: [
                    'no_reg', 'no_rawat', 'tgl_registrasi', 'jam_reg',
                    'kd_dokter', 'no_rkm_medis', 'p_jawab', 'almt_pj',
                    'hubunganpj', 'biaya_reg', 'status_lanjut', 'status_bayar'
                ],
                include: [
                    {
                        model: dokter,
                        as: 'dokter',
                        attributes: ['nm_dokter'],
                        required: true
                    },
                    {
                        model: pasien,
                        as: 'pasien',
                        attributes: [
                            'nm_pasien',
                            'no_peserta',
                            'tgl_lahir',
                            [
                                sequelize.literal(
                                    "IF(pasien.jk = 'L', 'Laki-Laki', 'Perempuan')"
                                ),
                                'jk'
                            ],
                            'umur'
                        ],
                        required: true
                    },
                    {
                        model: poliklinik,
                        as: 'poliklinik',
                        attributes: ['nm_poli'],
                        required: true
                    },
                    {
                        model: penjab,
                        as: 'penjab',
                        attributes: ['png_jawab'],
                        required: true
                    },
                    {
                        model: diagnosa_pasien,
                        as: 'diagnosa_pasien',
                        attributes: ['kd_penyakit'],
                        required: false
                    },
                    {
                        model: prosedur_pasien,
                        as: 'prosedur_pasien',
                        attributes: ['kode'],
                        required: false
                    },
                    {
                        model: bridging_sep,
                        as: 'bridging_sep',
                        required: false,
                        where: {
                            jnspelayanan: sequelize.literal(
                                "(CASE WHEN status_lanjut = 'Ranap' THEN '1' ELSE '2' END)"
                            ),
                        },
                        attributes: ['no_sep', 'no_rawat', 'tglsep', 'klsrawat', 'jnspelayanan']
                    }
                ],
                where: whereConditions,
                order: [
                    ['tgl_registrasi', 'ASC'],
                    ['jam_reg', 'DESC']
                ]
            });
            return res.status(200).json({
                status: true,
                message: 'Data inacbg',
                data: result
            }
            );
        } catch (err) {
            console.log(err);
            return res.status(400).json({
                status: false,
                message: 'Bad Request',
                data: err
            });
        }
    }
}
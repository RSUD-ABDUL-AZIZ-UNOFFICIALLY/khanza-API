const { callEklaim } = require('../helpers/api');
const { penjab, poliklinik, pasien, dokter, icd10, icd9, penyakit, kategori_penyakit, reg_periksa, diagnosa_pasien, prosedur_pasien, sequelize } = require('../models');
const { Op } = require("sequelize");
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
    regisList: async (req, res) => {
        try {
            const carabayar = req.query.carabayar || 'bpj';
            const keyword = req.query.keyword || '';
            const tanggalawal = req.query.tanggalawal || '2024-01-01';
            const tanggalakhir = req.query.tanggalakhir || '2024-01-01';
            const whereConditions = {
                stts: {
                    [Op.ne]: 'Batal'
                },
                tgl_registrasi: {
                    [Op.between]: [
                        `${tanggalawal}`,
                        `${tanggalakhir}`
                    ]
                }
            };

            if (carabayar) {
                whereConditions['$penjab.png_jawab$'] = {
                    [Op.like]: `%${carabayar}%`
                };
            }

            if (keyword) {
                whereConditions[Op.or] = [
                    { no_rawat: { [Op.like]: `%${keyword}%` } },
                    { tgl_registrasi: { [Op.like]: `%${keyword}%` } },
                    { kd_dokter: { [Op.like]: `%${keyword}%` } },
                    { '$dokter.nm_dokter$': { [Op.like]: `%${keyword}%` } },
                    { no_rkm_medis: { [Op.like]: `%${keyword}%` } },
                    { status_bayar: { [Op.like]: `%${keyword}%` } },
                    { '$pasien.nm_pasien$': { [Op.like]: `%${keyword}%` } },
                    { '$poliklinik.nm_poli$': { [Op.like]: `%${keyword}%` } },
                    { '$penjab.png_jawab$': { [Op.like]: `%${keyword}%` } }
                ];
            }

            const result = await reg_periksa.findAll({
                attributes: [
                    'no_reg', 'no_rawat', 'tgl_registrasi', 'jam_reg',
                    'kd_dokter', 'no_rkm_medis', 'p_jawab', 'almt_pj',
                    'hubunganpj', 'biaya_reg', 'status_bayar'
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
                            'nm_pasien',
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
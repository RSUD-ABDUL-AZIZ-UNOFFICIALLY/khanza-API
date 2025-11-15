"use strict";
const { reg_periksa, poliklinik, penjab, kamar_inap, kamar, bangsal, bridging_sep } = require("../models");
const { Op } = require("sequelize");
const fs = require('fs');
module.exports = {
  poliHarian: async (req, res) => {
    try {
      const query = req.query;
      let data_reg = await reg_periksa.findAll({
        attributes: [
          "no_reg",
          "no_rawat",
          "tgl_registrasi",
          "kd_poli",
          "status_lanjut",
          "stts",
        ],
        where: {
          tgl_registrasi: query.tgl_registrasi,
          status_lanjut: "Ralan",
        },
        include: [
          {
            model: poliklinik,
            as: "poliklinik",
            attributes: ["nm_poli"],
          },
        ],
      });
      const counts = [];
      let allrecord = {
        sudah: 0,
        belum: 0,
        batal: 0,
        total: data_reg.length,
      };
      for (let i of data_reg) {
        if (i.stts === "Sudah") {
          allrecord.sudah++;
        }
        if (i.stts === "Belum") {
          allrecord.belum++;
        }
        if (i.stts === "Batal") {
          allrecord.batal++;
        }
        const kd_poli = i.kd_poli;
        const poliklinikName = i.poliklinik.nm_poli;
        const status = i.stts;
        // Cari apakah sudah ada entri untuk kd_poli ini
        const existingEntry = counts.find((item) => item.kd_poli === kd_poli);

        if (existingEntry) {
          // Jika sudah ada, tambahkan jumlah poliklinik dan status
          existingEntry.poli_reg++;
          if (status === "Sudah") {
            existingEntry.status.Sudah++;
          }
          if (status === "Belum") {
            existingEntry.status.Belum++;
          }
          if (status === "Batal") {
            existingEntry.status.Batal++;
          }
          if (status === "Berkas Diterima") {
            existingEntry.status.Berkas_Diterima++;
          }
        } else {
          // Jika belum ada, buat entri baru
          let action = {};
          if (status === "Sudah") {
            action = {
              Sudah: 1,
              Belum: 0,
              Batal: 0,
              Berkas_Diterima: 0,
            };
          }
          if (status === "Belum") {
            action = {
              Sudah: 0,
              Belum: 1,
              Batal: 0,
              Berkas_Diterima: 0,
            };
          }
          if (status === "Batal") {
            action = {
              Sudah: 0,
              Belum: 0,
              Batal: 1,
              Berkas_Diterima: 0,
            };
          }
          if (status === "Berkas Diterima") {
            action = {
              Sudah: 0,
              Belum: 0,
              Batal: 0,
              Berkas_Diterima: 1,
            };
          }
          const newEntry = {
            kd_poli,
            poliklinik: poliklinikName,
            poli_reg: 1,
            status: action,
          };
          counts.push(newEntry);
        }
      }
      let sortedData = counts.sort((a, b) => b.poli_reg - a.poli_reg);
      return res.status(200).json({
        status: true,
        message: "Stastistik Pelayanan Poliklinik",
        record: counts.length,
        data: {
          allrecord: allrecord,
          poliklinik: sortedData,
        },
        // data: data_reg
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getKunjungan: async (req, res) => {
    try {
      const param = req.query;
      const { id } = req.params;
      let data_reg = await reg_periksa.findAll({
        attributes: [
          "kd_poli",
        ],
        where: {
          tgl_registrasi: { [Op.between]: [param.from, param.until] },
          status_lanjut: id,
          stts: { [Op.ne]: "Batal" },
        },
        include: [
          {
            model: poliklinik,
            as: "poliklinik",
            attributes: ["nm_poli"],
          },
        ],
      });
      const counts = [];
      for (let i of data_reg) {
        const kd_poli = i.kd_poli;
        const poliklinikName = i.poliklinik.nm_poli;
        // Cari apakah sudah ada entri untuk kd_poli ini
        const existingEntry = counts.find((item) => item.kd_poli === kd_poli);
        if (existingEntry) {
          // Jika sudah ada, tambahkan jumlah poliklinik dan status
          existingEntry.totalKunjungan++;
        } else {
          // Jika belum ada, buat entri baru
          const newEntry = {
            kd_poli,
            poliklinik: poliklinikName,
            totalKunjungan: 1,
          };
          counts.push(newEntry);
        }
      }
      let sortedData = counts.sort((a, b) => b.totalKunjungan - a.totalKunjungan);
      return res.status(200).json({
        status: true,
        message: "Stastistik Pelayanan Poliklinik",
        record: counts.length,
        data: {
            allrecord: data_reg.length,
            poliklinik: sortedData,
          },
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getAsuransi: async (req, res) => {
    try {
      const param = req.query;
      const { id } = req.params;
    const getAsuransi = await reg_periksa.findAll({
      attributes: [
        "kd_pj"
      ],
      where: {
        tgl_registrasi: { [Op.between]: [param.from, param.until] },
        status_lanjut: id,
        stts: { [Op.ne]: "Batal" },
      },
      include: [
        {
          model: penjab,
          as: "penjab",
          attributes: ["png_jawab"],
        },
      ],
    });
    const counts = [];
    for (let i of getAsuransi) {
      const kd_pj = i.kd_pj;
      const penjabName = i.penjab.png_jawab;
      // Cari apakah sudah ada entri untuk kd_poli ini
      const existingEntry = counts.find((item) => item.kd_pj === kd_pj);
      if (existingEntry) {
        // Jika sudah ada, tambahkan jumlah poliklinik dan status
        existingEntry.totalKunjungan++;
      } else {
        // Jika belum ada, buat entri baru
        const newEntry = {
          kd_pj,
          penjab: penjabName,
          totalKunjungan: 1,
        };
        counts.push(newEntry);
      }
    }
    let sortedData = counts.sort((a, b) => b.totalKunjungan - a.totalKunjungan);
    return res.status(200).json({
      status: true,
      message: "Stastistik pengunaan asurasni pelayanan poliklinik",
      record: counts.length,
      data: {
          allrecord: getAsuransi.length,
          penjab: sortedData,
        },
    });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getAsuransiPulang: async (req, res) => {
    try {
      const param = req.query;
      const { id } = req.params;
      let inacbg = fs.readFileSync('controllers/inacbg/' + param.dataINACBG, 'utf-8');
      inacbg = JSON.parse(inacbg);
      let count = await kamar_inap.findAll({
        where: {
          tgl_keluar: { [Op.between]: [param.from, param.until] },
          stts_pulang: { [Op.notIn]: ["-", "Pindah Kamar"] },
          '$reg_periksa.kd_pj$': "BPJ",
          '$reg_periksa.bridging_sep.no_sep$': { [Op.ne]: null },
          '$reg_periksa.bridging_sep.jnspelayanan$': '1'
        },
        include: [
          {
            model: reg_periksa,
            as: "reg_periksa",
            attributes: ["kd_pj", "no_rawat", "no_rkm_medis"],
            include: [
              {
                model: bridging_sep,
                as: "bridging_sep",
                attributes: ["no_sep"],
              }
            ]
          },
        ]
      })
      const noSepArray = count.map(item => item.reg_periksa.bridging_sep.no_sep);
      const noInacbgArray = inacbg.map(item => item.SEP);

      const unmatchedArray = count.filter(count =>
        !inacbg.some(inacbg => inacbg.SEP === count.reg_periksa.bridging_sep.no_sep)
      );
      return res.status(200).json({
        status: true,
        message: "Stastistik ",
        record: count.length,
        // record_sep: noSepArray.length,
        record_unmatchedArray: unmatchedArray.length,
        record_inacbg: noInacbgArray.length,
        data: {
          unmatchedArray: unmatchedArray,
          reg: count,
        },
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getBelumPulang: async (req, res) => {
    try {
      const rawatInap = await kamar_inap.findAll({
        attributes: [
          "kd_kamar",
          "stts_pulang",
        ],
        where: {
          stts_pulang: "-",
        },
        include: [
          {
            model: kamar,
            as: "kode_kamar",
            attributes: ["kd_bangsal"],
            include: [
              {
                model: bangsal,
                as: "bangsal",
                attributes: ["nm_bangsal"],
              },
            ],
          },
        ],
        order : [
          ['kd_kamar', 'DESC'],
        ],
      });

      // grup by bangsal
      // count per bangsal
      const counts = [];
      for (let i of rawatInap) {
        const kd_bangsal = i.kode_kamar.bangsal.nm_bangsal;
        const status = i.stts_pulang;
        // Cari apakah sudah ada entri untuk kd_poli ini
        const existingEntry = counts.find((item) => item.kd_bangsal === kd_bangsal);
        if (existingEntry) {
          // Jika sudah ada, tambahkan jumlah poliklinik dan status
          if (status === "-") {
            existingEntry.belumPulang++;
          }
        } else {
          // Jika belum ada, buat entri baru
          let action = {};
          if (status === "-") {
            action = {
              belumPulang: 1,
            };
          }
          const newEntry = {
            kd_bangsal,
            belumPulang: 1,
          };
          counts.push(newEntry);
        }
      }
      let sortedData = counts.sort((a, b) => b.belumPulang - a.belumPulang);
      
      return res.status(200).json({
        status: true,
        message: "Stastistik rawat inap pasien belum pulang",
        record: counts.length,
        data: sortedData,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getpenyakit: async (req, res) => {
    try {
      const param = req.query;
      return res.status(200).json({
        status: true,
        message: "Reg Penyakit ralan",
        record: 0,
        data: param,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  test: async (req, res) => {
    try {
      const param = req.query;
      return res.status(200).json({
        status: true,
        message: "poliHarian",
        record: 0,
        data: param,
      });
    } catch (err) {
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getPulang: async (req, res) => {
    try {
      const query = req.query;
      const rawatInap = await kamar_inap.findAll({
        attributes: [
          "no_rawat",
          "tgl_masuk",
          "tgl_keluar",
          "kd_kamar",
          "stts_pulang",
        ],
        where: {
          tgl_keluar: { [Op.between]: [query.from, query.until] },
          stts_pulang: { [Op.ne]: "-" },
          stts_pulang: { [Op.ne]: "Pindah Kamar" },
        },
        include: [
          {
            model: kamar,
            as: "kode_kamar",
            attributes: ["kd_bangsal"],
            include: [
              {
                model: bangsal,
                as: "bangsal",
                attributes: ["nm_bangsal"],
              },
            ],
          },
        ],
        order: [
          ['kd_kamar', 'DESC'],
        ],
      });

      // grup by bangsal
      // count per bangsal
      const counts = [];
      for (let i of rawatInap) {
        const kd_bangsal = i.kode_kamar.bangsal.nm_bangsal;
        const kd_kamar = i.kd_kamar;
        const status = i.stts_pulang;
        // Cari apakah sudah ada entri untuk kd_poli ini
        const existingEntry = counts.find((item) => item.kd_bangsal === kd_bangsal);
        if (existingEntry) {
          existingEntry.pasien++;
          // Jika sudah ada, tambahkan jumlah poliklinik dan status
          if (status === "Sehat") {
            existingEntry.data.sehat++;
          }
          if (status === "Rujuk") {
            existingEntry.data.rujuk++;
          }
          if (status === "APS") {
            existingEntry.data.aps++;
          }
          if (status === "+") {
            existingEntry.data.positif++;
          }
          if (status === "Meninggal") {
            existingEntry.data.meninggal++;
          }
          if (status === "Sembuh") {
            existingEntry.data.sembuh++;
          }
          if (status === "Membaik") {
            existingEntry.data.membaik++;
          }
          if (status === "Pulang Paksa") {
            existingEntry.data.pulangPaksa++;
          }
          if (status === "Status Belum Lengkap") {
            existingEntry.data.statusBelumLengkap++;
          }
          if (status === "Atas Persetujuan Dokter") {
            existingEntry.data.persetujuanDokter++;
          }
          if (status === "Atas Permintaan Sendiri") {
            existingEntry.data.permintaanSendiri++;
          }
          if (status === "Isoman") {
            existingEntry.data.isoman++;
          }
          if (status === "Lain-lain") {
            existingEntry.data.lainlain++;
          }

        } else {
          // Jika belum ada, buat entri baru
          let action = {};
          if (status === "Sehat") {
            action = {
              sehat: 1,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Rujuk") {
            action = {
              sehat: 0,
              rujuk: 1,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "APS") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 1,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "+") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 1,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Meninggal") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 1,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Sembuh") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 1,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Membaik") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 1,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Pulang Paksa") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 1,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Status Belum Lengkap") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 1,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Atas Persetujuan Dokter") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 1,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Atas Permintaan Sendiri") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 1,
              isoman: 0,
              lainlain: 0,
            };
          }
          if (status === "Isoman") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 1,
              lainlain: 0,
            };
          }
          if (status === "Lain-lain") {
            action = {
              sehat: 0,
              rujuk: 0,
              aps: 0,
              positif: 0,
              meninggal: 0,
              sembuh: 0,
              membaik: 0,
              pulangPaksa: 0,
              statusBelumLengkap: 0,
              persetujuanDokter: 0,
              permintaanSendiri: 0,
              isoman: 0,
              lainlain: 1,
            };
          }
          const newEntry = {
            kd_bangsal,
            pasien: 1,
            data: action

          };
          counts.push(newEntry);
        }
      }
      let sortedData = counts.sort((a, b) => b.pasien - a.pasien);
      return res.status(200).json({
        status: true,
        message: "Stastistik Rawat Inap Pasien pulang",
        record: counts.length,
        data: sortedData
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  },
  getKamarInap: async (req, res) => {
    try {
      const kamars = await kamar.findAll({
        attributes: [
          "kd_bangsal",
        ],
        where: {
          statusdata: "1",
        },
        group: ["kd_bangsal"],
        include: [
          {
            model: bangsal,
            as: "bangsal",
            attributes: ["nm_bangsal"],
          },
        ],
      });
      const counts = [];
      for (let i of kamars) {
        let { isi, kosong, booking, total } = 0;
        isi = await kamar.count({
          where: {
            kd_bangsal: i.kd_bangsal,
            status: "ISI",
            statusdata: "1",

          },
        });
        kosong = await kamar.count({
          where: {
            kd_bangsal: i.kd_bangsal,
            status: "KOSONG",
            statusdata: "1",
          },
        });
        booking = await kamar.count({
          where: {
            kd_bangsal: i.kd_bangsal,
            status: "DIBOOKING",
            statusdata: "1",
          },
        });
        total = isi + kosong + booking;

        let stts_kamar = {
          kd_bangsal: i.kd_bangsal,
          bangsal: i.bangsal.nm_bangsal,
          isi: isi,
          kosong: kosong,
          booking: booking,
          total: total,
        }
        counts.push(stts_kamar);
      }
      let sortedData = counts.sort((a, b) => b.isi - a.isi);
      return res.status(200).json({
        status: true,
        message: "Stastistik ketersediaan kamar inap",
        record: counts.length,
        data: sortedData
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        status: false,
        message: "Bad Request",
        data: err,
      });
    }
  }
};

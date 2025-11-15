const {
  reg_periksa,
  pasien,
  dokter,
  poliklinik,
  jadwal,
  pegawai,
  pemeriksaan_ralan,
  bridging_sep,
  dpjp_ranap,
  operasi,
  paket_operasi,
  bangsal,
  kamar,
  kamar_inap,
  maping_dokter_dpjpvclaim,
  maping_poli_bpjs,
  rujukan_internal_poli,
} = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const { createClient } = require("redis");
const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_URL_PORT,
  },
});
client.connect();
client.on("connect", () => {
  console.log("Redis client connected");
});
client.on("error", (err) => {
  console.log("Something went wrong " + err);
});
client.on("end", () => {
  console.log("Redis client disconnected");
});
async function proses() {
  let getChace = fs.readFileSync("cache/" + "RawRanapJSx" + ".json");
  getChace = JSON.parse(getChace);
  let mapSEPs = getChace.map((item) => item.noSEP);
  let inacbg = fs.readFileSync("controllers/inacbg/ranap0425_v0.json", "utf-8");
  inacbg = JSON.parse(inacbg);
  let mapSEPInacbg = inacbg.map((item) => item.SEP);
  console.log(mapSEPs.length);
  console.log(mapSEPInacbg.length);
  let filterInacbg = mapSEPInacbg.filter((item) => !mapSEPs.includes(item));
  console.log(filterInacbg.length);
  let getSEPSIMRS = await bridging_sep.findAll({
    where: {
      no_sep: filterInacbg,
      jnspelayanan: "1",
    },
    attributes: [
      "no_rawat",
      "nomr",
      "no_sep",
      "nmdiagnosaawal",
      "kddpjp",
      "nmdpdjp",
    ],
  });
  console.log(getSEPSIMRS[0]);
  let chace = [];
  for (let e of getSEPSIMRS) {
    let datainacbg = inacbg.filter((item) => item.SEP === e.no_sep);
    datainacbg = datainacbg[0];
    let dataE = {
      noFPK: "x",
      tglSep: ubahFormatTanggal(datainacbg.ADMISSION_DATE),
      tglPulang: ubahFormatTanggal(datainacbg.DISCHARGE_DATE),
      noSEP: e.no_sep,
      kelasRawat: datainacbg.KELAS_RAWAT,
      noRawat: e.no_rawat,
      poli: "",
      status: "X#Proses Verifikasi",
      biaya: {
        byPengajuan: datainacbg.TARIF_INACBG,
        byTarifGruper: datainacbg.TARIF_INACBG,
        byTarifRS: datainacbg.TARIF_RS,
        byTopup: "0",
        bySetujui: parseInt(datainacbg.TARIF_INACBG),
        TARIF_INACBG: datainacbg.TARIF_INACBG,
        TARIF_RS: datainacbg.TARIF_RS,
        TARIF_POLI_EKS: "0",
      },
      peserta: {
        noKartu: datainacbg.NOKARTU,
        nama: datainacbg.NAMA_PASIEN,
        noMR: datainacbg.MRN,
      },
      Inacbg: {
        kode: datainacbg.INACBG,
        nama: datainacbg.DESKRIPSI_INACBG,
      },
      realcost: {
        PROSEDUR_NON_BEDAH: datainacbg.PROSEDUR_NON_BEDAH,
        PROSEDUR_BEDAH: datainacbg.PROSEDUR_BEDAH,
        PENUNJANG: datainacbg.PENUNJANG,
        KEPERAWATAN: datainacbg.KEPERAWATAN,
        KONSULTASI: datainacbg.KONSULTASI,
        RADIOLOGI: datainacbg.RADIOLOGI,
        LABORATORIUM: datainacbg.LABORATORIUM,
        PELAYANAN_DARAH: datainacbg.PELAYANAN_DARAH,
        KAMAR_AKOMODASI: datainacbg.KAMAR_AKOMODASI,
        OBAT: datainacbg.OBAT,
        ALKES: datainacbg.ALKES,
        BMHP: datainacbg.BMHP,
        REHABILITASI: datainacbg.REHABILITASI,
      },
      BIRTH_DATE: ubahFormatTanggal(datainacbg.BIRTH_DATE),
      UMUR_TAHUN: datainacbg.UMUR_TAHUN,
      SEX: datainacbg.SEX,
      DIAGLIST: datainacbg.DIAGLIST,
      PROCLIST: datainacbg.PROCLIST,
      DESKRIPSI_INACBG: datainacbg.DESKRIPSI_INACBG,
      LOS: datainacbg.LOS,
      DPJP_INACBG: datainacbg.DPJP,
      no_rawat: e.no_rawat,
      nmdpdjp: e.nmdpdjp,
      kddpjp: e.kddpjp,
    };
    let raberDPJP = await dpjp_ranap.findAll({
      where: {
        no_rawat: e.no_rawat,
      },
      attributes: ["kd_dokter"],
      include: [
        {
          model: dokter,
          as: "dokter",
          attributes: ["nm_dokter"],
        },
      ],
    });
    dataE.raberDPJP = raberDPJP;
    dataE.jumlahDPJP = raberDPJP.length;
    if (raberDPJP.length > 0) {
      dataE.DPJP_RANAP = raberDPJP
        .map((item) => item.dokter.nm_dokter)
        .join(", ");
    } else {
      dataE.DPJP_RANAP = "-";
    }
    let findBed = await kamar_inap.findAll({
      where: {
        no_rawat: e.no_rawat,
      },
      // attributes: ['kd_kamar', 'lama', 'tgl_masuk', 'tgl_keluar', 'stts_pulang'],
      include: [
        {
          model: kamar,
          as: "kode_kamar",
          attributes: ["kd_bangsal"],
          include: [
            {
              model: bangsal,
              as: "bangsal",
              // attributes: ['nm_bangsal']
            },
          ],
        },
      ],
    });
    // console.log(findBed);
    dataE.kamar = findBed;
    let namaKamar = findBed
      .map(
        (item) =>
          item.dataValues.kode_kamar.bangsal.nm_bangsal +
          " - " +
          item.dataValues.lama +
          " hari"
      )
      .join(", ");
    dataE.kamarInap = namaKamar;
    chace.push(dataE);
  }

  let sisasepBackded = filterInacbg.filter(
    (item) => !getSEPSIMRS.some((sep) => sep.no_sep === item)
  );
  console.log(sisasepBackded.length);
  for (let e of sisasepBackded) {
    console.log(e);
    let datainacbg = inacbg.filter((item) => item.SEP === e);
    datainacbg = datainacbg[0];
    console.log(datainacbg);
    let dataE = {
      noFPK: "y",
      tglSep: ubahFormatTanggal(datainacbg.ADMISSION_DATE),
      tglPulang: ubahFormatTanggal(datainacbg.DISCHARGE_DATE),
      noSEP: e.no_sep,
      kelasRawat: datainacbg.KELAS_RAWAT,
      noRawat: e.no_rawat,
      poli: "",
      status: "X#Proses Verifikasi",
      biaya: {
        byPengajuan: datainacbg.TARIF_INACBG,
        byTarifGruper: datainacbg.TARIF_INACBG,
        byTarifRS: datainacbg.TARIF_RS,
        byTopup: "0",
        bySetujui: parseInt(datainacbg.TARIF_INACBG),
        TARIF_INACBG: datainacbg.TARIF_INACBG,
        TARIF_RS: datainacbg.TARIF_RS,
        TARIF_POLI_EKS: "0",
      },
      peserta: {
        noKartu: datainacbg.NOKARTU,
        nama: datainacbg.NAMA_PASIEN,
        noMR: datainacbg.MRN,
      },
      Inacbg: {
        kode: datainacbg.INACBG,
        nama: datainacbg.DESKRIPSI_INACBG,
      },
      realcost: {
        PROSEDUR_NON_BEDAH: datainacbg.PROSEDUR_NON_BEDAH,
        PROSEDUR_BEDAH: datainacbg.PROSEDUR_BEDAH,
        PENUNJANG: datainacbg.PENUNJANG,
        KEPERAWATAN: datainacbg.KEPERAWATAN,
        KONSULTASI: datainacbg.KONSULTASI,
        RADIOLOGI: datainacbg.RADIOLOGI,
        LABORATORIUM: datainacbg.LABORATORIUM,
        PELAYANAN_DARAH: datainacbg.PELAYANAN_DARAH,
        KAMAR_AKOMODASI: datainacbg.KAMAR_AKOMODASI,
        OBAT: datainacbg.OBAT,
        ALKES: datainacbg.ALKES,
        BMHP: datainacbg.BMHP,
        REHABILITASI: datainacbg.REHABILITASI,
      },
      BIRTH_DATE: ubahFormatTanggal(datainacbg.BIRTH_DATE),
      UMUR_TAHUN: datainacbg.UMUR_TAHUN,
      SEX: datainacbg.SEX,
      DIAGLIST: datainacbg.DIAGLIST,
      PROCLIST: datainacbg.PROCLIST,
      DESKRIPSI_INACBG: datainacbg.DESKRIPSI_INACBG,
      LOS: datainacbg.LOS,
      DPJP_INACBG: datainacbg.DPJP,
    };
    let regData = await reg_periksa.findOne({
      where: {
        no_rkm_medis: datainacbg.MRN,
        tgl_registrasi: ubahFormatTanggal(datainacbg.ADMISSION_DATE),
      },
      attributes: ["no_rawat"],
      include: [
        {
          model: maping_dokter_dpjpvclaim,
          as: "maping_dokter_dpjpvclaim",
        },
      ],
    });
    dataE.no_rawat = regData.no_rawat;
    dataE.nmDPJP = regData.maping_dokter_dpjpvclaim.nm_dokter_bpjs;
    dataE.kdDPJP = regData.maping_dokter_dpjpvclaim.kd_dokter_bpjs;
    let raberDPJP = await dpjp_ranap.findAll({
      where: {
        no_rawat: regData.no_rawat,
      },
      attributes: ["kd_dokter"],
      include: [
        {
          model: dokter,
          as: "dokter",
          attributes: ["nm_dokter"],
        },
      ],
    });
    dataE.raberDPJP = raberDPJP;
    dataE.jumlahDPJP = raberDPJP.length;
    if (raberDPJP.length > 0) {
      dataE.DPJP_RANAP = raberDPJP
        .map((item) => item.dokter.nm_dokter)
        .join(", ");
    } else {
      dataE.DPJP_RANAP = "-";
    }
    let findBed = await kamar_inap.findAll({
      where: {
        no_rawat: regData.no_rawat,
      },
      // attributes: ['kd_kamar', 'lama', 'tgl_masuk', 'tgl_keluar', 'stts_pulang'],
      include: [
        {
          model: kamar,
          as: "kode_kamar",
          attributes: ["kd_bangsal"],
          include: [
            {
              model: bangsal,
              as: "bangsal",
              // attributes: ['nm_bangsal']
            },
          ],
        },
      ],
    });
    // console.log(findBed);
    dataE.kamar = findBed;
    let namaKamar = findBed
      .map(
        (item) =>
          item.dataValues.kode_kamar.bangsal.nm_bangsal +
          " - " +
          item.dataValues.lama +
          " hari"
      )
      .join(", ");
    dataE.kamarInap = namaKamar;
    chace.push(dataE);
  }

  chace = chace.concat(getChace);

  fs.writeFileSync("cache/" + "RawRanapJS" + ".json", JSON.stringify(chace));
}

async function concat() {
  let chace = fs.readFileSync("cache/" + "RawRanapJS" + ".json");
  // let pending = fs.readFileSync('cache/' + 'RawRanapJSPending' + '.json');
  // chace = JSON.parse(chace);
  // pending = JSON.parse(pending);
  // chace = chace.concat(pending);
  // fs.writeFileSync('cache/' + 'RawRanapJSx' + '.json', JSON.stringify(chace));
  console.log(chace.length);
}

// concat();

// proses();

async function prosesRalan(param) {
  let getData = await client.json.get(
    `data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`,
    "$"
  );
  console.log(getData.length);
  let dataBPJS = getData.map((item) => item.noSEP);
  // console.log(dataBPJS);
  let dataInacbg = fs.readFileSync("cache/" + "ralan0425" + ".json");
  dataInacbg = JSON.parse(dataInacbg);
  console.log(dataInacbg.length);
  let filterInacbg = dataInacbg.filter((item) => !dataBPJS.includes(item.SEP));
  // console.log(filterInacbg);
  for (let e of filterInacbg) {
    let data = {
      noFPK: "Y",
        tglSep: ubahFormatTanggal(e.ADMISSION_DATE), 
      tglPulang: ubahFormatTanggal(e.DISCHARGE_DATE),
      noSEP: e.SEP,
        kelasRawat: e.KELAS_RAWAT,
      poli: "X",
      status: "X#BELUM",
      biaya: {
          byPengajuan: e.TARIF_INACBG,
          byTarifGruper: e.TARIF_INACBG,
          byTarifRS: e.TARIF_RS,
        byTopup: "0",
          bySetujui: e.TARIF_INACBG,
      },
      peserta: {
          noKartu: e.NOKARTU,
          nama: e.NAMA_PASIEN,
          noMR: e.MRN,
      },
        Inacbg: { kode: e.INACBG, nama: e.DESKRIPSI_INACBG },
    };

   getData.push(data)
  }
//   await client.expire(
//     `data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`,
//     60 * 60
//   );
  await client.json.set(
    `data:monitoring:klaim:${param.from}:${param.until}:${param.pelayanan}:getDataBPJS`,
    "$",
    getData
  );
console.log(getData.length);
}
prosesRalan({
  from: "2025-04-01",
  until: "2025-04-30",
  pelayanan: "2",
});
function ubahFormatTanggal(tanggal) {
  const [hari, bulan, tahun] = tanggal.split("/");
  return `${tahun}-${bulan}-${hari}`;
}

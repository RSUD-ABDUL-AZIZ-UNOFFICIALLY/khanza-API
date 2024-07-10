const e = require("express");

function BPJS_Setujui(duit) {
    let Jasa_sarana = 65 / 100 * duit;
    let Jasa_pelayanan = 35 / 100 * duit;
    let data = {
        Jasa_sarana,
        Jasa_pelayanan
    }
    return data;
}

function formasi(duit, dventi, dbedah) {
    let venti, bedah, bangsal;
    if (dventi && dbedah) {
        venti = Math.round(30 / 100 * duit);
        bedah = Math.round(40 / 100 * duit);
        bangsal = Math.round(30 / 100 * duit);
        let data = {
            venti,
            bedah,
            bangsal
        }
        return data;
    }
    if (dventi && !dbedah) {
        venti = Math.round(30 / 100 * duit);
        bedah = 0;
        bangsal = Math.round(70 / 100 * duit);
        let data = {
            venti,
            bedah,
            bangsal
        }
        return data;
    }
    if (!dventi && dbedah) {
        venti = 0;
        bedah = Math.round(60 / 100 * duit);
        bangsal = Math.round(40 / 100 * duit);
        let data = {
            venti,
            bedah,
            bangsal
        }
        return data;
    }

    if (!dventi && !dbedah) {
        venti = 0;
        bedah = 0;
        bangsal = duit;
        let data = {
            venti,
            bedah,
            bangsal
        }
        return data;
    }

}

function medis(duit, hemo) {
    let dr_DPJP_48 = Math.round(48 / 100 * duit);
    let pr_31 = Math.round(31 / 100 * duit);
    let mm_21 = Math.round(21 / 100 * duit);
    let hemodialisa = hemo ? 100000 : 0;
    let pr_ruangan = Math.round(pr_31 - hemodialisa);
    let data = {
        dr_DPJP_48,
        pr_31,
        mm_21,
        pr_ruangan,
        hemodialisa
    }
    return data;
}

function OKA(duit) {
    let dpjp_OK = Math.round(65 / 100 * duit);// 65
    let dr_anestesi = Math.round(35 / 100 * duit); // 35
    let dr_operator_OK = Math.round(79.5 / 100 * dpjp_OK);
    let pr_operator_OK = Math.round(20 / 100 * dpjp_OK);
    let cssd = Math.round(0.5 / 100 * dpjp_OK);
    let data = {
        dr_anestesi,
        dpjp_OK,
        dr_operator_OK,
        pr_operator_OK,
        cssd
    }
    return data;

}

function ventilator(duit) {
    let dr_anestesi = Math.round(50 / 100 * duit);
    let pr_ventilator = Math.round(20 / 100 * duit);
    let dr_ventilator = Math.round(30 / 100 * duit);
    let data = {
        dr_anestesi,
        pr_ventilator,
        dr_ventilator
    }
    return data;
}


// dr operator OBGYN, bedah, tht, mata, 

// Buat Rekap Total

function penujang(duit, igd, oka) { // tambah dr dan pr  ambil di depan
    let jsOKA = 8;
    if (oka) {
        jsOKA = 3;
    }
    let bcu = Math.round(jsOKA / 100 * duit);
    let tindakan2persen = Math.round(2 / 100 * duit);
    let BJP_strutural = Math.round(6.5 / 100 * duit);
    let lab = Math.round(3 / 100 * duit);
    let mkro = Math.round(1 / 100 * duit);
    let farmasi = Math.round(3 / 100 * duit);
    let radiologi = Math.round(4 / 100 * duit);
    let drIGD = igd ? 50000 : 0;
    let pr_igd = Math.round(igd ? 70000 : 0);
    let sisa = duit - (bcu + tindakan2persen + BJP_strutural + lab + mkro + farmasi + radiologi + drIGD + pr_igd);
    let data = {
        bcu,
        tindakan2persen,
        BJP_strutural,
        lab,
        mkro,
        farmasi,
        radiologi,
        drIGD,
        pr_igd,
        sisa
    }
    return data;
}
function tindakanPerawat(duit, prolis) {
    let fisio = findProlist(prolis, '93.39');
    let usg_jantung = findProlist(prolis, '88.72');
    let usg_tt = findProlist(prolis, '88.73');
    let usg_urologi = findProlist(prolis, '88.75');
    let usg_abdomen = findProlist(prolis, '88.76');
    let usg_obgyn = findProlist(prolis, '88.78');
    let usg_unspecified = findProlist(prolis, '88.79');
    let cek_ekg = findProlist(prolis, '89.52');
    let cek_gds = findProlist(prolis, '90.59');
    let fisioterapi = fisio ? 27000 : 0;
    let USG = usg_jantung || usg_tt || usg_urologi || usg_abdomen || usg_obgyn || usg_unspecified ? 9000 : 0;
    let EKG = cek_ekg ? 4100 : 0;
    let GDS = cek_gds ? 4100 : 0;
    let tindakan_usg = "";
    if (usg_jantung) {
        tindakan_usg += "Echocardiography, ";
    }
    if (usg_tt) {
        tindakan_usg += "Other sites of torax, ";
    }
    if (usg_urologi) {
        tindakan_usg += "Urology, ";
    }
    if (usg_abdomen) {
        tindakan_usg += "Abdomen, ";
    }
    if (usg_obgyn) {
        tindakan_usg += "Obgyn, ";
    }
    tindakan_usg = tindakan_usg.replace(/,\s*$/, "");
    return {
        fisioterapi,
        EKG,
        GDS,
        USG,
        tindakan_usg
    }
}

// rabe ralan 40 60
// rabe inap igd di depan dr dan ranap
// tindakan penujainag di abmil di depan
// bcu jadi 8 perse
// 2 persen penunag 
//  nebulizer 93.94,

function penujangRajal(duit) {
    let BJP_strutural = Math.round(6.5 / 100 * duit);
    let penujang_medis = Math.round(93.5 / 100 * duit);
    let mikro = Math.round(1 / 100 * penujang_medis);
    let lab = Math.round(3 / 100 * penujang_medis);
    let farmasi = Math.round(3 / 100 * penujang_medis);
    let radiologi = Math.round(4 / 100 * penujang_medis);
    let medis = penujang_medis - (mikro + lab + farmasi + radiologi);
    let dokter_48 = Math.round(48 / 100 * medis);
    let perawat_31 = Math.round(31 / 100 * medis);
    let managemnt_21 = Math.round(21 / 100 * medis);
    let data = {
        BJP_strutural,
        penujang_medis,
        mikro,
        lab,
        farmasi,
        radiologi,
        medis,
        dokter_48,
        perawat_31,
        managemnt_21
    }
    return data;
}

function findProlist(PROCLIST, targetValue) {
    const array = String(PROCLIST).split(";");
    // Find the index of the target value in the array
    const index = array.indexOf(targetValue);
    return index !== -1;
}

function parsingBangsal(dataKlaim, bangsal) {
    let sttKamar = ((dataKlaim.Bangsal1 === bangsal || dataKlaim.Bangsal2 === bangsal || dataKlaim.Bangsal3 === bangsal));
    if (sttKamar) {
        let dataPasein = {
            noFPK: dataKlaim.noFPK,
            SEP: dataKlaim.SEP,
            nama_pasien: dataKlaim.nama_pasien,
            noMR: dataKlaim.noMR,
            noBPJS: dataKlaim.noBPJS,
            kelasRawat: dataKlaim.kelasRawat,
            tglSep: dataKlaim.tglSep,
            tglPulang: dataKlaim.tglPulang,
            bangsal1: dataKlaim.Bangsal1,
            kamar: dataKlaim.Kamar1,
            js_pr_inapB1: dataKlaim.Bangsal1 != bangsal ? 0 : dataKlaim.js_pr_inapB1,
            bangsal2: dataKlaim.Bangsal2,
            kamar2: dataKlaim.Kamar2,
            js_pr_inapB2: dataKlaim.Bangsal2 != bangsal ? 0 : dataKlaim.js_pr_inapB2,
            bangsal3: dataKlaim.Bangsal3,
            kamar3: dataKlaim.Kamar3,
            js_pr_inapB3: dataKlaim.Bangsal3 != bangsal ? 0 : dataKlaim.js_pr_inapB3,
            bangsal4: dataKlaim.Bangsal4,
            kamar4: dataKlaim.Kamar4,
            js_pr_inapB4: dataKlaim.Bangsal4 != bangsal ? 0 : dataKlaim.js_pr_inapB4,
        }
        return dataPasein;
    }
    return null;
}
function parsingBangsalPending(dataKlaim, bangsal) {
    let sttKamar = ((dataKlaim.Bangsal1 === bangsal || dataKlaim.Bangsal2 === bangsal || dataKlaim.Bangsal3 === bangsal));
    if (sttKamar) {
        let dataPasein = {
            noFPK: dataKlaim.noFPK,
            SEP: dataKlaim.noSEP,
            nama_pasien: dataKlaim.nama_pasien,
            noMR: dataKlaim.noMR,
            noBPJS: dataKlaim.noBPJS,
            kelasRawat: dataKlaim.kelasRawat,
            tglSep: dataKlaim.tglSep,
            tglPulang: dataKlaim.tglPulang,
            bangsal1: dataKlaim.Bangsal1,
            kamar: dataKlaim.Kamar1,
            js_pr_inapB1: dataKlaim.Bangsal1 != bangsal ? 0 : dataKlaim.js_pr_inapB1,
            bangsal2: dataKlaim.Bangsal2,
            kamar2: dataKlaim.Kamar2,
            js_pr_inapB2: dataKlaim.Bangsal2 != bangsal ? 0 : dataKlaim.js_pr_inapB2,
            bangsal3: dataKlaim.Bangsal3,
            kamar3: dataKlaim.Kamar3,
            js_pr_inapB3: dataKlaim.Bangsal3 != bangsal ? 0 : dataKlaim.js_pr_inapB3,
            bangsal4: dataKlaim.Bangsal4,
            kamar4: dataKlaim.Kamar4,
            js_pr_inapB4: dataKlaim.Bangsal4 != bangsal ? 0 : dataKlaim.js_pr_inapB4,
        }
        return dataPasein;
    }
    return null;
}
function isCaseInsensitiveInclude(mainStr, subStr) {

    if (mainStr === null || subStr === null) {
        return false;
    }
    // Mengonversi kedua string menjadi huruf kecil
    let lowerMainStr = mainStr.toLowerCase();
    let lowerSubStr = subStr.toLowerCase();
    // Memeriksa apakah string utama mengandung string yang diinginkan
    return lowerMainStr.includes(lowerSubStr);
}

function parsingDPJP(dataKlaim, dpjp, js_dpjp) {
    if (dataKlaim.DPJP_INACBG.includes(dpjp)) {
        let jumlah_dpjp = 0;
        let dpjp_ke = 0;
        for (let key in js_dpjp) {
            if (dataKlaim.DPJP_INACBG.includes(key)) {
                jumlah_dpjp++;
            }
        }

        if (isCaseInsensitiveInclude(dataKlaim.dpjp_ranap_bpj, dpjp)) {
            dpjp_ke = 1;
        } else {
            dpjp_ke = jumlah_dpjp;
        }
        let NamaBangsal = "";
        if (dataKlaim.Bangsal1 != "-") {
            NamaBangsal += dataKlaim.Bangsal1;
        }
        if (dataKlaim.Bangsal2 != "-") {
            NamaBangsal += ", " + dataKlaim.Bangsal2;
        }
        if (dataKlaim.Bangsal3 != "-") {
            NamaBangsal += ", " + dataKlaim.Bangsal3;
        }
        if (dataKlaim.Bangsal4 != "-") {
            NamaBangsal += ", " + dataKlaim.Bangsal4;
        }
        let dpjp1 = 0;
        let dpjp2 = 0;
        let dpjp3 = 0;
        let dpjp4 = 0;
        let js_utama = 0;
        let js_raber = 0;
        // =IF(T2=1,100%*AB2,IF(T2=2,60%*AB2,IF(T2=3,43.34%*AB2,IF(T2=4,35.02%*AB2,0))))
        // =IF(T2=1,0%*AB2,IF(T2=2,40%*AB2,IF(T2=3,28.33%*AB2,IF(T2=4,21.66%*AB2,0))))
        // =IF(T2=1,0%*AB2,IF(T2=2,0%*AB2,IF(T2=3,28.33%*AB2,IF(T2=4,21.66%*AB2,0))))
        // =IF(T2=1,0%*AB2,IF(T2=2,0%*AB2,IF(T2=3,0%*AB2,IF(T2=4,21.66%*AB2,0))))
        if (jumlah_dpjp === 1) {
            dpjp1 = dataKlaim.dr_DPJP_48;
            dpjp2 = 0;
            dpjp3 = 0;
            dpjp4 = 0;
        }
        if (jumlah_dpjp === 2) {
            dpjp1 = Math.round(60 / 100 * dataKlaim.dr_DPJP_48);
            dpjp2 = Math.round(40 / 100 * dataKlaim.dr_DPJP_48);
            dpjp3 = 0;
            dpjp4 = 0;
        }
        if (jumlah_dpjp === 3) {
            dpjp1 = Math.round(43.34 / 100 * dataKlaim.dr_DPJP_48);
            dpjp2 = Math.round(28.33 / 100 * dataKlaim.dr_DPJP_48);
            dpjp3 = Math.round(28.33 / 100 * dataKlaim.dr_DPJP_48);
            dpjp4 = 0;
        }
        if (jumlah_dpjp === 4) {
            dpjp1 = Math.round(35.02 / 100 * dataKlaim.dr_DPJP_48);
            dpjp2 = Math.round(21.66 / 100 * dataKlaim.dr_DPJP_48);
            dpjp3 = Math.round(21.66 / 100 * dataKlaim.dr_DPJP_48);
            dpjp4 = Math.round(21.66 / 100 * dataKlaim.dr_DPJP_48);
        }
        if (dpjp_ke === 1) {
            js_utama = dataKlaim.dr_DPJP_48;
            js_raber = 0;
        } else {
            js_utama = 0;
            js_raber = dpjp2;
        }





        let dataPasein = {
            noFPK: dataKlaim.noFPK,
            SEP: dataKlaim.SEP,
            nama_pasien: dataKlaim.nama_pasien,
            noMR: dataKlaim.noMR,
            noBPJS: dataKlaim.noBPJS,
            kelasRawat: dataKlaim.kelasRawat,
            DESKRIPSI_INACBG: dataKlaim.DESKRIPSI_INACBG,
            DIAGLIST: dataKlaim.DIAGLIST,
            PROCLIST: dataKlaim.PROCLIST,
            tglSep: dataKlaim.tglSep,
            tglPulang: dataKlaim.tglPulang,
            lamaInap: dataKlaim.LOS,
            Bangsal: NamaBangsal,
            dpjp_ranap_RS4: dataKlaim.dpjp_ranap_RS4,
            dpjp_ranap_RS3: dataKlaim.dpjp_ranap_RS3,
            dpjp_ranap_RS2: dataKlaim.dpjp_ranap_RS2,
            dpjp_ranap_RS1: dataKlaim.dpjp_ranap_RS1,
            dpjp_ranap_bpj: dataKlaim.dpjp_ranap_bpj,
            DPJP_INACBG: dataKlaim.DPJP_INACBG,
            jumlah_dpjp: jumlah_dpjp,
            dpjp_ke: dpjp_ke,
            dpjp1: dpjp1,
            dpjp2: dpjp2,
            dpjp3: dpjp3,
            dpjp4: dpjp4,
            js_utama: js_utama,
            js_raber: js_raber,
            dr_DPJP_48: dataKlaim.dr_DPJP_48,
            BEDAH: dataKlaim.BEDAH,
            VENTI: dataKlaim.VENTI,
            CVC: dataKlaim.CVC,
            CDL: dataKlaim.CDL,
            EEG: dataKlaim.EEG,
            CTG: dataKlaim.CTG,
            "spinal canal": dataKlaim["spinal canal"],
            Biopsi: dataKlaim.Biopsi,
            Bronkoskopi: dataKlaim.Bronkoskopi,
            curettage: dataKlaim.curettage,
            dr_operator_OK: dataKlaim.dr_operator_OK,
            jumlah_operator: 0,
            dr_operator_OK_ke: 0,
            dr_operator_OK1: 0,
            dr_anestesi_OK: dataKlaim.dr_anestesi_OK,
            formasi_venti: dataKlaim.formasi_venti,
            dr_anestesi_venti: dataKlaim.dr_anestesi_venti,
            dr_ventilator: dataKlaim.dr_ventilator,
        }
        return dataPasein;
    }
    return null;

}
function groupData(array) {

    const uniqueValues = [...new Set(array)];;

    // Buat array baru yang berisi hanya nilai yang duplikat
    const duplicateValues = Array.from(array.filter(item => array.indexOf(item) !== array.lastIndexOf(item)));
    const countDuplicates = array.reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
    }, {});

    // Membuat array baru yang berisi nilai yang duplikat dan jumlah kemunculannya
    const duplicatesWithCount = Object.entries(countDuplicates)
        .filter(([key, value]) => value >= 1)
        .map(([key, value]) => ({ value: key, count: value }));

    return {
        uniqueValues: uniqueValues,
        duplicateValues: duplicateValues,
        duplicatesWithCount: duplicatesWithCount
    };
}

function rawRalan(e, cariSEP) {
    let totaltarif = parseInt(e.biaya.bySetujui);
    let bagi_rs = BPJS_Setujui(totaltarif);
    let data_penujangRajal = penujangRajal(bagi_rs.Jasa_pelayanan);
    try {
        let dataKlaim = {
            noFPK: e.noFPK,
            noSEP: e.noSEP,
            tglSep: e.tglSep,
            nama_pasien: cariSEP.peserta.nama,
            noMR: cariSEP.peserta.noMr,
            noBPJS: cariSEP.peserta.noKartu,
            tglLahir: cariSEP.peserta.tglLahir,
            kelasRawat: e.kelasRawat,
            nmDPJP: cariSEP.dpjp.nmDPJP,
            kdDPJP: cariSEP.dpjp.kdDPJP,
            poli: cariSEP.poli,
            Inacbg: e.Inacbg.kode + ' - ' + e.Inacbg.nama,
            bySetujui: parseInt(e.biaya.bySetujui),
            byTarifGruper: parseInt(e.biaya.byTarifGruper),
            byTarifRS: parseInt(e.biaya.byTarifRS),
            Jasa_sarana: bagi_rs.Jasa_sarana,
            Jasa_pelayanan: bagi_rs.Jasa_pelayanan,
            BJP_strutural: data_penujangRajal.BJP_strutural,
            penujang_medis: data_penujangRajal.penujang_medis,
            mikro: data_penujangRajal.mikro,
            lab: data_penujangRajal.lab,
            farmasi: data_penujangRajal.farmasi,
            radiologi: data_penujangRajal.radiologi,
            medis: data_penujangRajal.medis,
            dokter_48: data_penujangRajal.dokter_48,
            perawat_31: data_penujangRajal.perawat_31,
            managemnt_21: data_penujangRajal.managemnt_21,
        }
        // dataRAW.push(dataKlaim);
        return dataKlaim;
    } catch (error) {
        console.log(error);
        console.log(cariSEP);
    }
}
function rawRanap(element, getDataSEP) {
    let dpjp_ranap_bpj = getDataSEP.kontrol.nmDokter;
    let prolis = element.PROCLIST;
    let DIAGLIST = element.DIAGLIST;
    let igd = true;
    let hemo = (findProlist(prolis, '39.95') || findProlist(prolis, '38.93') || findProlist(prolis, '38.95')) ? true : false;
    let venti = (findProlist(prolis, '96.72') || findProlist(prolis, '96.71')) ? true : false;
    let bedah = element.PROSEDUR_BEDAH > 0 ? true : false;
    let bagi_rs = BPJS_Setujui(parseInt(element.TOTAL_TARIF));
    let duit_formasi = formasi(bagi_rs.Jasa_pelayanan, venti, bedah);
    let bagi_penujang = penujang(duit_formasi.bangsal, igd, bedah);
    let bagi_tindakanPerawat = tindakanPerawat(bagi_penujang.tindakan2persen, prolis)
    let sisa2 = Math.round(bagi_penujang.tindakan2persen - bagi_tindakanPerawat.tindakan_usg - bagi_tindakanPerawat.fisioterapi - bagi_tindakanPerawat.EKG - bagi_tindakanPerawat.GDS - bagi_tindakanPerawat.USG);
    let bagi_medis = medis(bagi_penujang.sisa, hemo);
    let duit_oka = OKA(duit_formasi.bedah);
    let duit_ventilator = ventilator(duit_formasi.venti);

    let dataKlaim = {
        noFPK: "-",
        SEP: element.SEP,
        nama_pasien: element.NAMA_PASIEN,
        noMR: element.MRN,
        noBPJS: element.NOKARTU,
        kelasRawat: element.KELAS_RAWAT,
        tglSep: element.ADMISSION_DATE,
        tglPulang: element.DISCHARGE_DATE,
        kode_inacbg_bpjs: "-",
        nama_inacbg_bpjs: element.DESKRIPSI_INACBG,
        TOTAL_TARIF: element.TOTAL_TARIF,
        TARIF_RS: element.TARIF_RS,
        TARIF_BPJS: parseInt(element.TARIF_INACBG),
        TARIF_PROSEDUR_BEDAH: element.PROSEDUR_BEDAH,
        LOS: element.LOS,
        ICU_INDIKATOR: element.ICU_INDIKATOR,
        ICU_LOS: element.ICU_LOS,
        VENT_HOUR: element.VENT_HOUR,
        jalurMasuk: '-',
        Kamar1: "-",
        Bangsal1: "-",
        js_pr_inapB1: "-",
        Kamar2: '-',
        Bangsal2: '-',
        js_pr_inapB2: '-',
        Kamar3: '-',
        Bangsal3: '-',
        js_pr_inapB3: '-',
        Kamar4: '-',
        Bangsal4: '-',
        js_pr_inapB4: '-',
        DESKRIPSI_INACBG: element.DESKRIPSI_INACBG,
        DIAGLIST: String(DIAGLIST),
        PROCLIST: String(prolis),
        DPJP_INACBG: element.DPJP,
        dpjp_ranap_bpj: dpjp_ranap_bpj,
        dpjp_ranap_RS1: '-',
        dpjp_ranap_RS2: '-',
        dpjp_ranap_RS3: '-',
        dpjp_ranap_RS4: '-',
        ventilation_more96: findProlist(element.PROCLIST, '96.72') ? "Y" : "N",
        ventilation_less96: findProlist(element.PROCLIST, '96.71') ? "Y" : "N",
        endotracheal_intubasi: findProlist(element.PROCLIST, '96.04') ? "Y" : "N",
        IGD: igd ? "Y" : "N",
        VENTI: venti ? "Y" : "N",
        BEDAH: bedah ? "Y" : "N",
        CVC: findProlist(element.PROCLIST, '38.93') ? "Y" : "N",
        CDL: findProlist(element.PROCLIST, '38.95') ? "Y" : "N",
        Bronkoskopi: findProlist(element.PROCLIST, '33.23') ? "Y" : "N",
        EEG: findProlist(element.PROCLIST, '89.14') ? "Y" : "N",
        CTG: findProlist(element.PROCLIST, '75.32') ? "Y" : "N",
        Biopsi: findProlist(element.PROCLIST, '45.15') ? "Y" : "N",
        "spinal canal": findProlist(element.PROCLIST, '03.92') ? "Y" : "N",
        curettage: findProlist(element.PROCLIST, '69.09') ? "Y" : "N",
        tindakan_usg: bagi_tindakanPerawat.tindakan_usg,
        Jasa_sarana: bagi_rs.Jasa_sarana,
        Jasa_pelayanan: bagi_rs.Jasa_pelayanan,
        formasi_bangsal: duit_formasi.bangsal,
        bcu: bagi_penujang.bcu,
        "tindakan2%": bagi_penujang.tindakan2persen,
        fisio: bagi_tindakanPerawat.fisioterapi,
        ekg: Math.round(bagi_tindakanPerawat.EKG),
        gds: Math.round(bagi_tindakanPerawat.GDS),
        usg: Math.round(bagi_tindakanPerawat.USG),
        "sisa2%": sisa2,
        struktural: bagi_penujang.BJP_strutural,
        lab: bagi_penujang.lab,
        mikro: bagi_penujang.mkro,
        farmasi: bagi_penujang.farmasi,
        radiologi: bagi_penujang.radiologi,
        drIGD: bagi_penujang.drIGD,
        pr_igd: bagi_penujang.pr_igd,
        dikurangi: bagi_penujang.sisa,
        dr_DPJP_48: bagi_medis.dr_DPJP_48,
        pr_31: bagi_medis.pr_31,
        pr_ruangan: bagi_medis.pr_ruangan,
        hemo: bagi_medis.hemodialisa,
        managemnt_21: bagi_medis.mm_21,
        formasi_bedah: duit_formasi.bedah,
        dpjp_oka_60: duit_oka.dpjp_OK,
        dr_operator_OK: duit_oka.dr_operator_OK,
        pr_operator_OK: duit_oka.pr_operator_OK,
        cssd: duit_oka.cssd,
        anestesi_35: duit_oka.anestsi_OK,
        dr_anestesi_OK: duit_oka.dr_anestesi,
        formasi_venti: duit_formasi.venti,
        dr_anestesi_venti: duit_ventilator.dr_anestesi,
        pr_venti: duit_ventilator.pr_ventilator,
        dr_ventilator: duit_ventilator.dr_ventilator,
    }
    return dataKlaim;
}

function fomulaRemon(duit) {
    let Farmasi, Labotarium, Radiologi, Microbiologi, UTD, Rehap_Medik, Struktrual, Medis, Paramedis, manajemen;
    Farmasi = Math.round(2.2 / 100 * duit);
    Labotarium = Math.round(2 / 100 * duit);
    Radiologi = Math.round(3 / 100 * duit);
    Microbiologi = Math.round(0.75 / 100 * duit);
    UTD = Math.round(0.75 / 100 * duit);
    Rehap_Medik = Math.round(0.75 / 100 * duit);
    Struktrual = Math.round(7.5 / 100 * duit);
    Medis = Math.round(41.75 / 100 * duit);
    Paramedis = Math.round(23.30 / 100 * duit);
    manajemen = Math.round(18 / 100 * duit);
    let data = {
        Farmasi,
        Labotarium,
        Radiologi,
        Microbiologi,
        UTD,
        Rehap_Medik,
        Struktrual,
        Medis,
        Paramedis,
        manajemen
    }
    return data;
}

function fomulaRaber(duti, dpjp_ke, jumlah) {
    let dpjpUtama = 0;
    let dpjpRaber = 0;
    // =IF(S6=1,100%*AA6,IF(S6=2,60%*AA6,IF(S6=3,43.34%*AA6,IF(S6=4,35.02%*AA6,0))))
    if (dpjp_ke === 1) {
        if (jumlah === 1) {
            dpjpUtama = duti;
            dpjpRaber = 0;
        } else if (jumlah === 2) {
            dpjpUtama = Math.round(60 / 100 * duti);
        } else if (jumlah === 3) {
            dpjpUtama = Math.round(43.34 / 100 * duti);
        } else if (jumlah === 4) {
            dpjpUtama = Math.round(35.02 / 100 * duti);
        } else if (jumlah === 5) {
            dpjpUtama = Math.round(30 / 100 * duti);;
        } else if (jumlah === 6) {
            dpjpUtama = Math.round(26 / 100 * duti);
        }

    } else {
        if (jumlah === 2) {
            dpjpUtama = 0;
            dpjpRaber = Math.round(40 / 100 * duti);
        } else if (jumlah === 3) {
            dpjpUtama = 0;
            dpjpRaber = Math.round(28.33 / 100 * duti);
        } else if (jumlah === 4) {
            dpjpUtama = 0;
            dpjpRaber = Math.round(21.66 / 100 * duti);
        } else if (jumlah === 5) {
            dpjpUtama = 0;
            dpjpRaber = Math.round(17.5 / 100 * duti);
        } else if (jumlah === 6) {
            dpjpUtama = 0;
            dpjpRaber = Math.round(14.8 / 100 * duti);
        }
    }
    return {
        dpjpUtama,
        dpjpRaber,
    }
}
function formasiBedah(duit) {
    let pOperator = Math.round(65 / 100 * duit);
    let drOperator = Math.round(79.5 / 100 * pOperator);
    let cssd = Math.round(0.5 / 100 * pOperator);
    let prOperator = Math.round(20 / 100 * pOperator);

    let pAnestesi = Math.round(35 / 100 * duit);
    let drAnestesi = Math.round(80 / 100 * pAnestesi);
    let prAnestesi = Math.round(20 / 100 * pAnestesi);
    return {
        pOperator,
        drOperator,
        cssd,
        prOperator,
        pAnestesi,
        drAnestesi,
        prAnestesi
    }
}
function formasiVenti(duit) {
    let drVenti = Math.round(60 / 100 * duit);
    let drDPJP = Math.round(20 / 100 * duit);
    let prVenti = Math.round(20 / 100 * duit);
    return {
        drVenti,
        drDPJP,
        prVenti
    }

}
module.exports = {
    BPJS_Setujui,
    formasi,
    penujang,
    OKA,
    ventilator,
    medis,
    findProlist,
    penujangRajal,
    tindakanPerawat,
    parsingBangsal,
    parsingBangsalPending,
    parsingDPJP,
    groupData,
    rawRalan,
    rawRanap,
    fomulaRemon,
    fomulaRaber,
    formasiBedah,
    formasiVenti

}
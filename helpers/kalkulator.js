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
function parsingDPJP(dataKlaim, dpjp, js_dpjp) {
    if (dataKlaim.DPJP_INACBG.includes(dpjp)) {
        let jumlah_dpjp = 0;
        let dpjp_ke = 0;
        for (let key in js_dpjp) {
            if (dataKlaim.DPJP_INACBG.includes(key)) {
                jumlah_dpjp++;
            }
        }
        if (jumlah_dpjp === 1) {
            dpjp_ke = 1;
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
            dpjp_ranap_RS4: dataKlaim.dpjp_ranap_RS4,
            dpjp_ranap_RS3: dataKlaim.dpjp_ranap_RS3,
            dpjp_ranap_RS2: dataKlaim.dpjp_ranap_RS2,
            dpjp_ranap_RS1: dataKlaim.dpjp_ranap_RS1,
            dpjp_ranap_bpj: dataKlaim.dpjp_ranap_bpj,
            DPJP_INACBG: dataKlaim.DPJP_INACBG,
            jumlah_dpjp: jumlah_dpjp,
            dpjp_ke: dpjp_ke,
            dpjp1: 0,
            dpjp2: 0,
            dpjp3: 0,
            dpjp4: 0,
            js_utama: 0,
            js_raber: 0,
            BEDAH: dataKlaim.BEDAH,
            VENTI: dataKlaim.VENTI,
            CVC: dataKlaim.CVC,
            CDL: dataKlaim.CDL,
            EEG: dataKlaim.EEG,
            CTG: dataKlaim.CTG,
            Biopsi: dataKlaim.Biopsi,
            Bronkoskopi: dataKlaim.Bronkoskopi,
            dr_DPJP_48: dataKlaim.dr_DPJP_48,
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
    parsingDPJP

}
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

function medis(duit, duit_karu, igd) {
    let dr_DPJP_48 = Math.round(48 / 100 * duit);
    let pr_31 = Math.round(31 / 100 * duit);
    let mm_21 = Math.round(21 / 100 * duit);
    let pr_igd = Math.round(igd ? 70000 : 0);
    let karu = Math.round(duit_karu);
    let pr_ruangan = Math.round(pr_31 - pr_igd - karu);
    let data = {
        dr_DPJP_48,
        pr_31,
        mm_21,
        pr_igd,
        karu,
        pr_ruangan
    }
    return data;
}

function OKA(duit) {
    let dpjp_OK = Math.round(60 / 100 * duit);
    let anestsi_OK = Math.round(40 / 100 * duit);
    let dr_anestesi = Math.round(80 / 100 * anestsi_OK);
    let pr_anestesi = Math.round(20 / 100 * anestsi_OK);
    let dr_operator_OK = Math.round(70 / 100 * dpjp_OK);
    let pr_operator_OK = Math.round(29.5 / 100 * dpjp_OK);
    let cssd = Math.round(0.5 / 100 * dpjp_OK);
    let data = {
        anestsi_OK,
        dr_anestesi,
        pr_anestesi,
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


function penujang(duit, igd, fisioterapi, hd, oka) {
    let jsOKA = 10;
    if (oka) {
        jsOKA = 5;
    }
    let bcu = Math.round(10 / 100 * duit);
    let BJP_strutural = Math.round(6.5 / 100 * duit);
    let lab = Math.round(3 / 100 * duit);
    let mkro = Math.round(1 / 100 * duit);
    let farmasi = Math.round(3 / 100 * duit);
    let radiologi = Math.round(4 / 100 * duit);
    let drIGD = igd ? 50000 : 0;
    let fisio = fisioterapi ? 27000 : 0;
    let hemo = hd ? 100000 : 0;
    let sisa = duit - (bcu + BJP_strutural + lab + mkro + farmasi + radiologi + drIGD + fisio + hemo);
    let data = {
        bcu,
        BJP_strutural,
        lab,
        mkro,
        farmasi,
        radiologi,
        drIGD,
        fisio,
        hemo,
        sisa
    }
    return data;

}

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
    if (index !== -1) {
        return true;
    } else {
        return false;
    }
    return
}



module.exports = {
    BPJS_Setujui,
    formasi,
    penujang,
    OKA,
    ventilator,
    medis,
    findProlist,
    penujangRajal


}
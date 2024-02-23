const {
    BPJS_Setujui,
    formasi,
    penujang,
    medis,
    OKA,
    ventilator,
    findProlist,
} = require('../helpers/kalkulator');

// let pro = "99.07;89.52;90.59;91.99;99.60;31.1;87.49;38.93;02.39"
let pro = "39.95;99.04;93.39;99.18;90.59;91.99"
let target = "38.9"
console.log(findProlist(pro, target));

let duit = 2157900;
let bagi_rs = BPJS_Setujui(duit);
console.log(bagi_rs);

let igd = true;
let fisio = false;
let hemo = false;
let duit_karu = 26794;
let venti = false;
let bedah = true;

let duit_formasi = formasi(bagi_rs.Jasa_pelayanan, venti, bedah);
console.log(duit_formasi);


let bagi_penujang = penujang(duit_formasi.bangsal, igd, fisio, hemo, bedah);
console.log(bagi_penujang);
let bagi_medis = medis(bagi_penujang.sisa, duit_karu, igd);
console.log(bagi_medis);


let duit_oka = OKA(duit_formasi.bedah);
console.log(duit_oka);
let duit_ventilator = ventilator(duit_formasi.venti);
console.log(duit_ventilator);

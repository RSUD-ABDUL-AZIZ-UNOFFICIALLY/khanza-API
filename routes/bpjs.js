'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const bpjs = require('../controllers/bpjsController');

routes.get('/sep', bpjs.getSep);
routes.get('/monitoring', bpjs.getMonitoring);
routes.get('/monitoring/klaim', bpjs.monit);
routes.get('/monitoring/kunjungan', bpjs.kunjungan);
routes.get('/peserta/nik', bpjs.getPesertaByNik);
routes.get('/peserta/nokartu', bpjs.getPesertaByNokartu);
routes.get('/peserta/rujukan', bpjs.getRujukan);
routes.get('/peserta/jumlahsep', bpjs.getJumlahSEP);
routes.get('/peserta/listrencanakontrol', bpjs.ListRencanaKontrol);
routes.get('/peserta/getfinger', bpjs.getfinger);
routes.get('/peserta/getallfinger', bpjs.getallfinger);

routes.get('/kamar', bpjs.getKamar);
routes.post('/updatekamar', bpjs.updateKamar);
routes.post('/deletkamar', bpjs.delKamar);
routes.post('/addkamar', bpjs.addKamar);
routes.get('/refKamar', bpjs.refKamar);
routes.post('/antrean/add', bpjs.addAntrean);
routes.post('/antrean/farmasi/add', bpjs.addAntreanFarmasi);
routes.get('/antrean/pendaftaran', bpjs.getAntrean);
routes.post('/antrean/getlisttask', bpjs.getlisttask);
routes.post('/antrean/batal', bpjs.antrean_batal);
routes.post('/antrean/batal', bpjs.antrean_batal);
routes.post('/antrean/updatewaktu', bpjs.updatewaktu);
routes.get('/antrean/pendaftaranby', bpjs.getAntreanby);
routes.get('/antrean/jadwaldokter', bpjs.getJadwalDokter);
routes.get('/antrean/refdokter', bpjs.getRefDokter);
routes.get('/antrean/refpoli', bpjs.getRefPoli);
routes.post('/icare/validate', bpjs.icare);

module.exports = routes;
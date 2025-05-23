'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');
const registrasi = require('../controllers/registrasi');

routes.post('/bookingperiksa', middleware.check, registrasi.bookingPeriksa);
routes.get('/bookingperiksa', middleware.check, registrasi.cekBookingPeriksa);
routes.post('/bookingperiksa/batal', middleware.check, registrasi.batalBookingPeriksa);
routes.post('/bookingperiksa/cekin', middleware.check, registrasi.cekinBookingPeriksa);
routes.get('/jadwal', middleware.check,  registrasi.getJadwal);
routes.get('/alljadwal', middleware.check, registrasi.getAllJadwal);
routes.get('/jadwalBPJS', middleware.check, registrasi.getJadwalBpjs);
routes.get('/asuransi', middleware.check, registrasi.getAsuransi);
routes.post('/registrasi', middleware.check, registrasi.postRegistrasi);
routes.get('/findsep/:sep', middleware.check, registrasi.dataSEP);


module.exports = routes;
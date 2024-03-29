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
routes.get('/asuransi', middleware.check, registrasi.getAsuransi);


module.exports = routes;
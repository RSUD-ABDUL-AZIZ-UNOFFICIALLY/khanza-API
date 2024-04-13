'use strict';
const { Route } = require("express");
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const ralan = require('../controllers/ralan');


routes.get('/igd',middleware.check, ralan.getIGD);
routes.get('/poli',middleware.check, ralan.getPoli);
routes.get('/poli/:kd_poli',middleware.check, ralan.getPoliByKdPoli);
routes.get('/jadwal', middleware.check, ralan.getJadwalPoli);
routes.get('/jadwal/bydr', middleware.check, ralan.getJadwaldrPoli);
routes.get('/drpoli', middleware.check, ralan.getDrPoli);
routes.get('/antiran/poli', middleware.check, ralan.getAntiranPoli);
routes.get('/pemeriksaan', middleware.check, ralan.getPemeriksaan);
routes.post('/pemeriksaan', middleware.check, ralan.postPemeriksaan);
routes.get('/jasaruangan', ralan.getJasaRuangan);
routes.get('/getJasaDrRanap', ralan.getJasaDrRanap);
routes.get('/monitoring/jasa', ralan.monitoringJasa);


module.exports = routes;
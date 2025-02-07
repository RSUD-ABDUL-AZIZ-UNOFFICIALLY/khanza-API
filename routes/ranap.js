'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');
const ranap = require('../controllers/ranap');
const dashboard = require('../controllers/dashboard');


routes.get('/bp',middleware.check, ranap.getBp);
routes.get('/tm',middleware.check, ranap.getTglMasuk);
routes.get('/kamar',middleware.check, ranap.getKamar);
routes.get('/belumpulang', middleware.check, ranap.getBelumPulang);
routes.get('/dasboard/belumpulang', middleware.check, dashboard.getKamarInap);
routes.get('/dasboard/belumpulangbykelas', middleware.check, dashboard.getKamarInapbyKelas);
routes.get('/pasien/dpjp', ranap.getPxdpjp);

routes.get('/pemeriksaan', middleware.check, ranap.getPemeriksaan);

module.exports = routes;
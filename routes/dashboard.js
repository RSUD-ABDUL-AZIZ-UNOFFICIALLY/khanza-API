'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware/dasboard');

const dashboard = require('../controllers/dashboard');

// routes.get('/regpoli/daily', middleware.check, dashboard.poliHarian);
routes.get('/regpoli/day', middleware.dashboard, dashboard.poliHarian);
routes.get('/regpoli/reports', middleware.dashboard, dashboard.getKunjungan);
routes.get('/regpoli/asuransi', middleware.dashboard, dashboard.getAsuransi);
routes.get('/regranap/belumpulang', middleware.dashboard, dashboard.getBelumPulang);

module.exports = routes;
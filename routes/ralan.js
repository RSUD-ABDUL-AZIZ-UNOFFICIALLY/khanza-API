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
routes.get('/drpoli', middleware.check, ralan.getDrPoli);

module.exports = routes;
'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const petugas = require('../controllers/petugas');

routes.get('/dokter', middleware.check, petugas.getDokter);
routes.get('/dokter/:id', middleware.check, petugas.getDetailDokter);
routes.get('/perawat', middleware.check, petugas.getPerawat);
routes.get('/perawat/:id', middleware.check, petugas.getDetailPerawat);
routes.get('/pasien', middleware.check, petugas.getPasien);
routes.get('/pasien/:id', middleware.check, petugas.getDetailPasien);


module.exports = routes;
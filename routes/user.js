'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');
const user = require('../controllers/pegawai');


routes.get('/aksess/:nip', middleware.check, user.getUser);
routes.get('/password/:nip', middleware.check, user.getPassword);
routes.post('/password/:nik', middleware.check, user.addPassword);
routes.put('/password/:nip', middleware.check, user.updatedPasword);
routes.put('/hakases/:nip', middleware.check, user.updateHakAses);
routes.post('/hakases/', middleware.check, user.copyHakAkses);
routes.get('/cari', middleware.check, user.cariPegawai);
routes.put('/update/:nik', middleware.check, user.updateDataPegawai);


module.exports = routes;
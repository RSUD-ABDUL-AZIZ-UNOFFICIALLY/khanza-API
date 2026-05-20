'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const icd = require('../controllers/icd');

routes.get('/10',middleware.check, icd.geticd10);
routes.get('/10/:id', middleware.check, icd.getdetailICD10);
routes.get('/9', middleware.check, icd.geticd9);
routes.get('/9/:id', middleware.check, icd.getdetailICD9);
routes.get('/recap/10', icd.getRecapICD10);
routes.get('/recap/9', middleware.check, icd.getRecapICD9);
// routes.get('/recap/9/:id', middleware.check, icd.getRecapICD9Detail);

module.exports = routes;
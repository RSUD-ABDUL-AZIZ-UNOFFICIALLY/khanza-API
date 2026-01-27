'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const inacbg = require('../controllers/inacbg');

routes.post('/ws', middleware.check, inacbg.ws);
routes.post('/byreg', middleware.check, inacbg.regisList);
routes.post('/ranap/dpjp', middleware.check, inacbg.ranapdpjp);
routes.post('/ralan/dpjp', middleware.check, inacbg.bilingRalan);


module.exports = routes;
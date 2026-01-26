'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const inacbg = require('../controllers/inacbg');

routes.post('/ws', middleware.check, inacbg.ws);
routes.post('/byreg', middleware.check, inacbg.regisList);
routes.post('/ranap/dpjp', middleware.check, inacbg.ranapdpjp);

module.exports = routes;
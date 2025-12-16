'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const inacbg = require('../controllers/inacbg');

routes.post('/ws', middleware.check, inacbg.ws);
routes.post('/byreg', middleware.check, inacbg.regisList);

module.exports = routes;
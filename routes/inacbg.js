'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');

const inacbg = require('../controllers/inacbg');

routes.post('/ws', middleware.check, inacbg.ws);

module.exports = routes;
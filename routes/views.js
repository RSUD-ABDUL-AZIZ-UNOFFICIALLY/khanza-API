'use strict';
const express = require("express");
const routes = express.Router();
const views = require('../controllers/views');

routes.get('/ranap/dpjp', views.pxDPJP);

module.exports = routes;
'use strict';
const express = require("express");
const routes = express.Router();
const middleware = require('../middleware');
const antrol = require('../controllers/antrol');



routes.get('/hit', antrol.hit);
routes.get('/test', antrol.test);
module.exports = routes;
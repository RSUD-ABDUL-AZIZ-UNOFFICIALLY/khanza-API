'use strict';
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

const routes = require('./routes/ranap');
const routesicd = require('./routes/icd');
const routespetugas = require('./routes/petugas');
const routeralan  = require('./routes/ralan');
const routepenunjang  = require('./routes/penunjang');
const dashboard = require('./routes/dashboard');
app.use('/api/ranap', routes);
app.use('/api/ralan', routeralan);
app.use('/api/icd', routesicd);
app.use('/api/petugas', routespetugas);
app.use('/api/penunjang', routepenunjang);
app.use('/api/dashboard', dashboard);
// app.use('/api/surat', require('./routes/surat'));
app.use('/api/registrasi', require('./routes/registrasi'));
app.use('/api/users', require('./routes/user'));
app.use('/api/bpj/antrol', require('./routes/antrol'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('running on port', PORT);
});
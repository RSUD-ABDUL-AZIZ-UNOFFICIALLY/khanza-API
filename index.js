'use strict';
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.use(express.urlencoded({ extended: true }));
const { createClient } = require('redis');
const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_URL_PORT
    }
});
client.connect();
client.on('connect', () => {
    console.log('Redis client connected');
});
client.on('error', (err) => {
    console.log('Something went wrong ' + err);
});
client.on('end', () => {
    console.log('Redis client disconnected');
});
app.use((req, res, next) => {
    req.cache = client;
    next();
});

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

app.use("/api/cache/", express.static("cache/"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('running on port', PORT);
});
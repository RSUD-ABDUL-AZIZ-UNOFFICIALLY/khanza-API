const e = require("express");
const jwt = require("jsonwebtoken");
const axios = require('axios');
async function apiLPKP(nik) {
    let natanik = jwt.sign(nik, process.env.JWT_SECRET_KEY_LPKP);
    try {
        let config = {
            method: 'GET',
            url: process.env.HOST_API_LPKP + '?nik=' + natanik,
            headers: {
                "Content-Type": "application/json",
            },
        };
        let response = await axios(config);
        return response.data.data.url;
    } catch (err) {
        return err;
    }
}

module.exports = {
    apiLPKP
}
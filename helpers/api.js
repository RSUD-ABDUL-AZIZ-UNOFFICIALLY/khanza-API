const e = require("express");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const { inacbg_encrypt, inacbg_decrypt } = require("./encryption");
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

async function callEklaim(payload) {
    try {
        const encrypted = inacbg_encrypt(payload);

        const response = await axios.post(process.env.INACBG_UrlWS, encrypted, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const raw = response.data;

        // hilangkan header + footer seperti manual
        const cleaned = raw
            .replace("----BEGIN ENCRYPTED DATA----", "")
            .replace("----END ENCRYPTED DATA----", "")
            .trim();

        const decrypted = inacbg_decrypt(cleaned);

        return JSON.parse(decrypted);
    } catch (err) {
        console.error("API ERROR:", err.message);
        return { error: err.message };
    }
}

module.exports = {
    apiLPKP,
    callEklaim
}
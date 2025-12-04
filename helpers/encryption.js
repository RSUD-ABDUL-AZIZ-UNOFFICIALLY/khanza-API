// encryption.js
const crypto = require("crypto");
require("dotenv").config(); 

// SET KEY DARI E-KLAIM (HEX)
const key = process.env["INACBG_keyRS"];

const inacbg_compare = (signature, encrypt) => {
    const keys = Buffer.from(key, "hex");
    const calc_signature = crypto
        .createHmac("sha256", keys)
        .update(encrypt)
        .digest()
        .slice(0, 10);

    return signature.compare(calc_signature) === 0;
};

const inacbg_encrypt = (data) => {
    if (typeof data === "object") data = JSON.stringify(data);

    const keys = Buffer.from(key, "hex");
    const data_encoded = Buffer.from(data);

    const iv = crypto.randomBytes(16);
    const enc = crypto.createCipheriv("aes-256-cbc", keys, iv);
    const encrypt = Buffer.concat([enc.update(data_encoded), enc.final()]);

    const signature = crypto
        .createHmac("sha256", keys)
        .update(encrypt)
        .digest()
        .slice(0, 10);

    return Buffer.concat([signature, iv, encrypt]).toString("base64");
};

const inacbg_decrypt = (data) => {
    data = data.replace(
        /----BEGIN ENCRYPTED DATA----|----END ENCRYPTED DATA----/g,
        ""
    );

    const keys = Buffer.from(key, "hex");
    const data_decoded = Buffer.from(data, "base64");

    const signature = data_decoded.slice(0, 10);
    const iv = data_decoded.slice(10, 26);
    const encoded = data_decoded.slice(26);

    if (!inacbg_compare(signature, encoded)) {
        throw new Error("SIGNATURE_NOT_MATCH");
    }

    const dec = crypto.createDecipheriv("aes-256-cbc", keys, iv);
    const decrypted = Buffer.concat([dec.update(encoded), dec.final()]);

    return decrypted.toString("utf8");
};

module.exports = { inacbg_encrypt, inacbg_decrypt };

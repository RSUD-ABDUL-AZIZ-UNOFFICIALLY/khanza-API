const Bpjs = require('../helpers/bpjs'); // Sesuaikan path

// Helper untuk generate array tanggal (Y-m-d) dari 'from' ke 'until'
const generateDateList = (from, until) => {
    const dateList = [];
    let currentDate = new Date(from);
    const endDate = new Date(until);

    while (currentDate <= endDate) {
        // Format ke YYYY-MM-DD
        dateList.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateList;
};

// Helper untuk generate standar headers BPJS
const getHeaders = (data) => ({
    'X-cons-id': data.X_cons_id,
    'X-timestamp': data.timestamp,
    'X-signature': data.signature,
    'user_key': data.user_key,
    'Content-Type': 'application/json'
});

// Object penampung semua method controller
const BpjsController = {
    async getSep (req, res) {
        try {
            const bpjs = new Bpjs();
            const data = bpjs.getSignature(); // Bisa juga getSingnature() jika aliasnya dipakai

            // Di Express, ambil parameter (getVar) bisa dari req.query, req.params, atau req.body
            // Asumsi menggunakan query string: /api/sep?noSEP=000123...
            const noSEP = req.query.noSEP || req.body.noSEP;

            if (!noSEP) {
                return res.status(400).json({
                    metaData: { code: "400", message: "Parameter noSEP tidak boleh kosong" }
                });
            }

            const headers = getHeaders(data);

            const url = `${data.vclaimURL}/SEP/${noSEP}`;

            // Mengirim request (setara dengan Guzzle client->sendAsync)
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            // Parse response body sebagai JSON
            const bpjsRes = await response.json();

            // Jika balikan BPJS error/bukan 200, langsung kembalikan responsenya
            if (bpjsRes.metaData.code !== "200") {
                return res.json(bpjsRes);
            }

            // Proses dekripsi & dekompresi jika sukses
            const key = data.X_cons_id + data.secretKey + data.timestamp;

            let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
            hasil = bpjs.decompress(hasil);

            // Timpa payload response yang terenkripsi dengan data JSON aslinya
            bpjsRes.response = JSON.parse(hasil);

            // Kembalikan final response ke client
            return res.json(bpjsRes);

        } catch (error) {
            console.error("Gagal request ke VClaim:", error);
            return res.status(500).json({
                metaData: { code: "500", message: "Internal Server Error" }
            });
        }
    },
    async getMonitoring(req, res) {
        try {
            const bpjs = new Bpjs();
            const data = bpjs.getSignature();

            // Mengambil multiple parameter, bisa dari query string (GET) atau body (POST)
            const tanggal = req.query.tanggal || req.body.tanggal;
            const pelayanan = req.query.pelayanan || req.body.pelayanan;
            const status = req.query.status || req.body.status;

            // Validasi parameter agar tidak ada undefined di dalam URL
            if (!tanggal || !pelayanan || !status) {
                return res.status(400).json({
                    metaData: { code: "400", message: "Parameter tanggal, pelayanan, dan status harus diisi" }
                });
            }

            // Menyusun URL menggunakan Template Literals (backtick)
            const url = `${data.vclaimURL}/Monitoring/Klaim/Tanggal/${tanggal}/JnsPelayanan/${pelayanan}/Status/${status}`;
            const headers = getHeaders(data);
            // Eksekusi request dengan Fetch
            const response = await fetch(url, {
                method: 'GET', // Monitoring BPJS biasanya pakai GET
                headers: headers
            });

            const bpjsRes = await response.json();

            // Jika response gagal / tidak 200, kembalikan json aslinya
            if (bpjsRes.metaData.code !== "200") {
                return res.json(bpjsRes);
            }

            // Proses dekripsi & dekompresi
            const key = data.X_cons_id + data.secretKey + data.timestamp;

            let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
            hasil = bpjs.decompress(hasil);

            // Timpa response asli dengan data yang sudah diurai
            bpjsRes.response = JSON.parse(hasil);

            return res.json(bpjsRes);

        } catch (error) {
            console.error("Gagal request ke Monitoring VClaim:", error);
            return res.status(500).json({
                metaData: { code: "500", message: "Internal Server Error" }
            });
        }
    },
    async monit(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const pelayanan = req.query.pelayanan || req.body.pelayanan;
        const status = req.query.status || req.body.status;
        const from = req.query.from;
        const until = req.query.until;

        const dateList = generateDateList(from, until);
        let resultData = [];
        const headers = getHeaders(data);

        for (const tanggal of dateList) {
            const url = `${data.vclaimURL}/Monitoring/Klaim/Tanggal/${tanggal}/JnsPelayanan/${pelayanan}/Status/${status}`;
            const response = await fetch(url, { headers });
            const bpjsRes = await response.json();

            if (bpjsRes.metaData && bpjsRes.metaData.code === "200") {
                const key = data.X_cons_id + data.secretKey + data.timestamp;
                let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
                hasil = JSON.parse(bpjs.decompress(hasil));
                resultData = resultData.concat(hasil.klaim || []);
            }
        }

        return res.json({
            metaData: { code: "200", message: true },
            response: { record: resultData.length, data: resultData }
        });
    },

    async kunjungan(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const from = req.query.from;
        const until = req.query.until;
        const pelayanan = req.query.pelayanan || req.body.pelayanan;

        const dateList = generateDateList(from, until);
        let resultData = [];
        const headers = getHeaders(data);

        for (const tanggal of dateList) {
            const url = `${data.vclaimURL}/Monitoring/Kunjungan/Tanggal/${tanggal}/JnsPelayanan/${pelayanan}`;
            const response = await fetch(url, { headers });
            const bpjsRes = await response.json();

            if (bpjsRes.metaData && bpjsRes.metaData.code === "200") {
                const key = data.X_cons_id + data.secretKey + data.timestamp;
                let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
                hasil = JSON.parse(bpjs.decompress(hasil));
                resultData = resultData.concat(hasil.sep || []);
            }
        }

        return res.json({
            metaData: { code: "200", message: true },
            response: { record: resultData.length, data: resultData }
        });
    },

    async getPesertaByNik(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const nik = req.query.nik || req.body.nik;
        const tglSEP = req.query.tglSEP || req.body.tglSEP;

        const url = `${data.vclaimURL}/Peserta/nik/${nik}/tglSEP/${tglSEP}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getPesertaByNokartu(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const noKartu = req.query.nik || req.body.nik; // Di PHP anda pakai var 'nik' juga
        const tglSEP = req.query.tglSEP || req.body.tglSEP;

        const url = `${data.vclaimURL}/Peserta/nokartu/${noKartu}/tglSEP/${tglSEP}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getRujukan(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const noKartu = req.query.noKartu || req.body.noKartu;

        const url = `${data.vclaimURL}/Rujukan/List/Peserta/${noKartu}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getJumlahSEP(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const jenisRujukan = req.query.jenisRujukan || req.body.jenisRujukan;
        const noRujukan = req.query.noRujukan || req.body.noRujukan;

        const url = `${data.vclaimURL}/Rujukan/JumlahSEP/${jenisRujukan}/${noRujukan}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async ListRencanaKontrol(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const bulan = req.query.Bulan || req.body.Bulan;
        const tahun = req.query.Tahun || req.body.Tahun;
        const nokartu = req.query.Nokartu || req.body.Nokartu;
        const filter = req.query.filter || req.body.filter;

        const url = `${data.vclaimURL}/RencanaKontrol/ListRencanaKontrol/Bulan/${bulan}/Tahun/${tahun}/Nokartu/${nokartu}/filter/${filter}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getfinger(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const nokartu = req.query.Nokartu || req.body.Nokartu;
        const tglpelayanan = req.query.Tglpelayanan || req.body.Tglpelayanan;

        const url = `${data.vclaimURL}/SEP/FingerPrint/Peserta/${nokartu}/TglPelayanan/${tglpelayanan}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getallfinger(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const tglpelayanan = req.query.Tglpelayanan || req.body.Tglpelayanan;

        const url = `${data.vclaimURL}/SEP/FingerPrint/List/Peserta/TglPelayanan/${tglpelayanan}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    // --- APLICARES / KAMAR (Tidak perlu dekripsi sesuai PHP aslinya) ---
    async getKamar(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const start = req.query.start || req.body.start;
        const limit = req.query.limit || req.body.limit;

        const url = `${data.URL}aplicaresws/rest/bed/read/${data.ppk}/${start}/${limit}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        return res.json(await response.json());
    },

    async updateKamar(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.URL}aplicaresws/rest/bed/update/${data.ppk}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json());
    },

    async delKamar(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.URL}aplicaresws/rest/bed/delete/${data.ppk}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json());
    },

    async addKamar(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.URL}aplicaresws/rest/bed/create/${data.ppk}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json());
    },

    async refKamar(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.URL}aplicaresws/rest/ref/kelas`;
        // Secara best practice REST, GET tidak pakai body, tapi karena kode PHP Anda
        // mengirim json_encode($kelas) di GET request, ini opsional di Node.
        const response = await fetch(url, { headers: getHeaders(data) });
        return res.json(await response.json());
    },

    // --- ANTREAN BPJS ---
    async addAntrean(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/antrean/add`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json());
    },

    async addAntreanFarmasi(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/antrean/farmasi/add`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json());
    },

    async getAntrean(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const tanggal = req.query.tanggal || req.body.tanggal;

        const url = `${data.baseURL}/antrean/pendaftaran/tanggal/${tanggal}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        // Antrean pakai metadata, bukan metaData
        if (bpjsRes.metadata.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getlisttask(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/antrean/getlisttask`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        const bpjsRes = await response.json();

        if (bpjsRes.metadata.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async antrean_batal(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/antrean/batal`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json()); // PHP tidak melakukan decrypt disini
    },

    async updatewaktu(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/antrean/updatewaktu`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        return res.json(await response.json());
    },

    async getAntreanby(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const from = req.query.from;
        const until = req.query.until;

        const dateList = generateDateList(from, until);
        let resultData = [];
        const headers = getHeaders(data);

        for (const tanggal of dateList) {
            const url = `${data.baseURL}/antrean/pendaftaran/tanggal/${tanggal}`;
            const response = await fetch(url, { headers });
            const bpjsRes = await response.json();

            if (bpjsRes.metadata && bpjsRes.metadata.code === "200") {
                const key = data.X_cons_id + data.secretKey + data.timestamp;
                let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
                hasil = JSON.parse(bpjs.decompress(hasil));
                resultData = resultData.concat(hasil || []);
            }
        }

        return res.json({
            metaData: { code: "200", message: true },
            response: { record: resultData.length, data: resultData }
        });
    },

    async getJadwalDokter(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const tanggal = req.query.tanggal || req.body.tanggal;
        const kd_poli = req.query.kd_poli_BPJS || req.body.kd_poli_BPJS;

        const url = `${data.baseURL}/jadwaldokter/kodepoli/${kd_poli}/tanggal/${tanggal}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        if (bpjsRes.metadata.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getRefDokter(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/ref/dokter`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        // Pada script aslinya langsung decrypt tanpa if pengecekan code 200
        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async getRefPoli(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.baseURL}/ref/poli`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    async addfarmasi(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();
        const bulan = req.query.bulan || req.body.bulan;
        const tahun = req.query.tahun || req.body.tahun;
        const filter = req.query.filter || req.body.filter;

        const url = `${data.vclaimURL}/Sep/updtglplg/list/bulan/${bulan}/tahun/${tahun}/${filter}`;
        const response = await fetch(url, { headers: getHeaders(data) });
        const bpjsRes = await response.json();

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    },

    // --- iCare (WSIHS) ---
    async icare(req, res) {
        const bpjs = new Bpjs();
        const data = bpjs.getSignature();

        const url = `${data.URL}wsihs/api/rs/validate`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(data),
            body: JSON.stringify(req.body)
        });
        const bpjsRes = await response.json();

        if (bpjsRes.metaData.code !== "200") return res.json(bpjsRes);

        const key = data.X_cons_id + data.secretKey + data.timestamp;
        let hasil = bpjs.stringDecrypt(key, bpjsRes.response);
        bpjsRes.response = JSON.parse(bpjs.decompress(hasil));
        return res.json(bpjsRes);
    }
};

module.exports = BpjsController;
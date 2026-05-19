# Khanza API Testing Guide

## 📋 Overview

Ada 2 cara untuk testing REST API Khanza:

1. **REST Client** - Langsung di VS Code (recommended untuk development)
2. **Postman** - Aplikasi standalone (recommended untuk team collaboration)

---

## 🔧 Option 1: REST Client (VS Code)

### Installation

1. **Install Extension**
   - Buka VS Code Extensions (Ctrl+Shift+X)
   - Cari "REST Client"
   - Install extension oleh **Huachao Mao** (paling populer)

2. **File Test**
   - File sudah tersedia: `test-api.http`
   - Buka file tersebut di VS Code

### Usage

#### Setup Token

1. Login ke aplikasi Khanza
2. Ambil JWT token dari Authentication header
3. Di file `test-api.http`, cari baris:
   ```
   @token = YOUR_JWT_TOKEN_HERE
   ```
4. Ganti dengan token Anda:
   ```
   @token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Send Request

- Klik link **"Send Request"** di atas setiap request
- Response akan muncul di panel sebelah kanan
- Atau gunakan shortcut: `Ctrl+Alt+R`

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+R` | Send last request |
| `Ctrl+Alt+H` | Show request history |
| `Ctrl+Alt+C` | Copy request as cURL |

### Features

✅ Syntax highlighting untuk HTTP  
✅ Auto-completion untuk headers  
✅ Response preview (JSON formatting)  
✅ Request history  
✅ Environment variables support  
✅ Simple & lightweight  

---

## 📦 Option 2: Postman

### Installation

1. **Download Postman**
   - Website: https://www.postman.com/downloads/
   - Install sesuai OS Anda

2. **Import Collection**
   - Buka Postman
   - Klik **"Import"** (tombol di kiri atas)
   - Pilih file: `Khanza-API.postman_collection.json`
   - Collection akan ter-import otomatis

### Usage

#### Setup Environment

1. **Create Environment**
   - Klik settings icon (gear) di kanan atas
   - Pilih **"Environments"**
   - Klik **"Create"**
   - Nama: "Khanza Local"

2. **Add Variables**
   ```
   VARIABLE          INITIAL VALUE           CURRENT VALUE
   baseUrl           http://localhost:3000   http://localhost:3000
   token             YOUR_JWT_TOKEN_HERE     [paste your token]
   ```

3. **Save Environment**

4. **Select Environment**
   - Di dropdown environment (kanan atas), pilih "Khanza Local"

#### Setup Token

1. Login ke aplikasi Khanza
2. Ambil JWT token
3. Di Postman, buka Environment "Khanza Local"
4. Paste token ke variable `token`
5. Save

#### Send Request

- Buka folder **"ICD-9 Recap (NEW)"**
- Pilih request yang ingin di-test
- Klik tombol **"Send"**
- Response tampil di bawah

### Features

✅ Collection organization  
✅ Environment management  
✅ Request pre-scripts & tests  
✅ Response testing & validation  
✅ API documentation generation  
✅ Collaboration & sharing  
✅ Cloud sync  

---

## 📝 Available Test Requests

### ICD-10 Tests
- `Search ICD-10` - Cari ICD-10 by keyword
- `Get ICD-10 Detail` - Detail single ICD-10 code
- `Get Recap ICD-10` - Most used ICD-10 in date range

### ICD-9 Tests
- `Search ICD-9` - Cari ICD-9 by keyword
- `Get ICD-9 Detail` - Detail single ICD-9 code

### ICD-9 Recap (NEW) ⭐
- `Get Most Used ICD-9 - Default Limit` (10 codes)
- `Get Most Used ICD-9 - Custom Limit` (25 codes)
- `Get Most Used ICD-9 - Short Period` (15 codes)
- `Q1/Q2/Q3/Q4 2024 Analysis` - Quarterly breakdown

### Error Test Cases
- `Missing Parameters` - Expected: 422
- `Missing 'from' Parameter` - Expected: 422
- `Limit Exceeds Maximum` - Expected: capped at 100

---

## 🎯 Testing Workflow

### Step 1: Setup
```bash
1. Start Khanza API server
   $ npm install
   $ node index.js
   
2. Ensure MariaDB & Redis running
```

### Step 2: Get Token
```bash
1. Login ke aplikasi Khanza
2. Ambil JWT token dari response atau browser dev tools
3. Update @token / environment variable
```

### Step 3: Run Tests

**REST Client:**
```
1. Buka test-api.http
2. Klik "Send Request" pada request yang ingin di-test
3. Lihat response di panel kanan
```

**Postman:**
```
1. Select environment "Khanza Local"
2. Buka collection "Khanza API - ICD Endpoints"
3. Klik request, kemudian "Send"
4. Lihat response di bawah
```

### Step 4: Verify Response

Check for:
- ✅ Status code 200 (success)
- ✅ Response format valid JSON
- ✅ Data contains expected fields
- ✅ No error messages

---

## 🔍 Response Format

### Success Response (200)
```json
{
  "status": true,
  "message": "Most used ICD-9 codes within date range",
  "record": 10,
  "date_range": {
    "from": "2024-01-01",
    "until": "2024-12-31"
  },
  "data": [
    {
      "kode": "V72.31",
      "deskripsi_pendek": "Examination of eye",
      "deskripsi_panjang": "...",
      "total_penggunaan": 145
    }
  ]
}
```

### Error Response (422)
```json
{
  "status": false,
  "message": "Parameters \"from\" and \"until\" are required (format: YYYY-MM-DD)",
  "data": null
}
```

---

## 🚀 Best Practices

### Before Testing
- ✅ Pastikan server running
- ✅ Pastikan database connected
- ✅ Pastikan Redis connected
- ✅ Update token yang valid
- ✅ Check date range ada data

### During Testing
- ✅ Mulai dari test yang simple
- ✅ Test error cases juga
- ✅ Verifikasi response format
- ✅ Check HTTP status codes
- ✅ Perhatikan response times

### After Testing
- ✅ Save test results
- ✅ Document issues/findings
- ✅ Update test cases jika ada changes
- ✅ Share results dengan team

---

## 🐛 Troubleshooting

### "Unable to connect to localhost:3000"
```
✓ Pastikan server running: node index.js
✓ Check port configuration
✓ Verify firewall settings
```

### "401 Unauthorized"
```
✓ Token expired - login lagi dan update token
✓ Token invalid - check JWT_SECRET_KEY di .env
✓ Wrong format - pastikan menggunakan "Bearer {token}"
```

### "422 Unprocessable Entity"
```
✓ Check parameter yang required
✓ Pastikan format date: YYYY-MM-DD
✓ Verify parameter values
```

### "500 Internal Server Error"
```
✓ Check server logs untuk error details
✓ Verify database connection
✓ Verify Redis connection
✓ Check data di database
```

---

## 📊 Example Testing Scenario

### Scenario: Analisis Diagnosa Januari 2024

1. **Request:**
   ```
   GET /api/icd/recap/9?from=2024-01-01&until=2024-01-31&limit=20
   ```

2. **Expected Response:**
   ```json
   {
     "status": true,
     "record": 20,
     "data": [
       {"kode": "V72.31", "total_penggunaan": 45},
       {"kode": "718.40", "total_penggunaan": 32},
       ...
     ]
   }
   ```

3. **Analysis:**
   - Identifikasi top diagnoses
   - Compare dengan bulan lain
   - Plan resource allocation

---

## 💡 Tips & Tricks

### REST Client Tips
- Save multiple environments dalam comments
- Gunakan variables untuk reusable values
- Organize requests dengan ### headers
- Copy requests sebagai cURL untuk debugging

### Postman Tips
- Create folders untuk organize requests
- Use pre-request scripts untuk setup
- Add tests untuk validate responses
- Export collections untuk backup

---

## 📞 Support

Jika ada masalah:
1. Check documentation: `API_DOCS_ICD9_RECAP.md`
2. Check implementation: `IMPLEMENTATION_ICD9_RECAP.md`
3. Check logs server
4. Verify configuration di `.env`

---

## 📚 Related Files

- `test-api.http` - REST Client test file
- `Khanza-API.postman_collection.json` - Postman collection
- `API_DOCS_ICD9_RECAP.md` - API documentation
- `IMPLEMENTATION_ICD9_RECAP.md` - Implementation details

---

**Happy Testing! 🎉**

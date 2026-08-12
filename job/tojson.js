const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function convertExcelToJson() {
    console.log("Mulai konversi Excel ke JSON...");

    // Tentukan nama/path file input dan output
    const inputFilePath = path.join(__dirname, '../cache/DPJP_RANAP_DES_2025.xlsx');
    const outputFilePath = path.join(__dirname, '../cache/DPJP_RANAP_DES_2025.json');

    // Cek apakah file Excel tersedia
    if (!fs.existsSync(inputFilePath)) {
        console.error(`File Excel tidak ditemukan: ${inputFilePath}`);
        return;
    }

    try {
        // 1. Buka dan baca file Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(inputFilePath);

        const finalData = {};

        // 2. Iterasi setiap sheet di dalam Workbook
        workbook.eachSheet((sheet) => {
            const sheetName = sheet.name;
            const rowCount = sheet.rowCount;
            const colCount = sheet.columnCount;

            // Proses hanya jika sheet memiliki lebih dari 1 baris (header + data)
            if (rowCount > 1) {
                const sheetJson = [];
                const headers = [];
                const headerRow = sheet.getRow(1);

                // Ambil nilai Header (ExcelJS menggunakan indeks 1 untuk kolom/baris)
                for (let col = 1; col <= colCount; col++) {
                    let cellValue = headerRow.getCell(col).value;
                    // Pastikan header ada namanya untuk kunci JSON, jika kosong gunakan "Column_X"
                    headers[col] = cellValue ? cellValue.toString().trim() : `Column_${col}`;
                }

                // 3. Iterasi data mulai dari baris ke-2
                for (let rowIndex = 2; rowIndex <= rowCount; rowIndex++) {
                    const row = sheet.getRow(rowIndex);

                    // Abaikan baris jika benar-benar kosong
                    if (!row.hasValues) continue;

                    const obj = {};
                    for (let col = 1; col <= colCount; col++) {
                        const header = headers[col];
                        let value = row.getCell(col).value;

                        // Tangani cell yang berupa formula (ambil hasil nilainya saja)
                        if (value && typeof value === 'object' && value.result !== undefined) {
                            value = value.result;
                        }
                        // Tangani cell yang berformat teks kaya (Rich Text)
                        else if (value && typeof value === 'object' && value.richText) {
                            value = value.richText.map(rt => rt.text).join('');
                        }

                        // Sesuai dengan Apps Script: jika string kosong jadikan null
                        obj[header] = (value !== null && value !== undefined && value !== "") ? value : null;
                    }
                    sheetJson.push(obj);
                }

                // Masukkan array data ke properti objek menggunakan nama Sheet
                finalData[sheetName] = sheetJson;
            }
        });

        // 4. Simpan hasil akhir ke file JSON
        const jsonString = JSON.stringify(finalData, null, 2);
        fs.writeFileSync(outputFilePath, jsonString, 'utf8');

        console.log(`Berhasil! File JSON '${outputFilePath}' tersimpan.`);
        return jsonString; // Opsional jika butuh dipanggil oleh fungsi lain

    } catch (e) {
        console.error("Gagal melakukan konversi: ", e.toString());
    }
}

// Eksekusi fungsi
convertExcelToJson();
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Fungsi utama
async function importJSONtoSpreadsheet() {
    console.log("Memulai proses konversi JSON ke Excel...");

    // 1. Baca file JSON lokal (ganti path sesuai lokasi file Anda)
    const jsonFilePath = path.join(__dirname, '../cache/RawRanap4FPK.json');//'./RawRanapDPJP1225.json';
    
    const excelFilePath = path.join(__dirname, '../cache/04 RAW RANAP APRL 2026.xlsx'); //'./DPJP_RANAP_DES_2025.xlsx';

    if (!fs.existsSync(jsonFilePath)) {
        console.error(`File tidak ditemukan: ${jsonFilePath}`);
        return;
    }

    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // 2. Inisialisasi Workbook Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NodeJS Script';

    // 3. Periksa bentuk JSON dan buat sheet
    if (Array.isArray(jsonData)) {
        writeSheet(workbook, "Sheet1", jsonData);
    } else {
        for (const key in jsonData) {
            if (Array.isArray(jsonData[key])) {
                writeSheet(workbook, key, jsonData[key]);
            }
        }
    }

    // 4. Buat halaman rekap
    // generateSummarySheet(workbook);

    // 5. Simpan file Excel
    await workbook.xlsx.writeFile(excelFilePath);
    console.log(`Berhasil! File Excel telah disimpan di: ${excelFilePath}`);
}

function writeSheet(workbook, sheetNameRaw, dataArray) {
    if (dataArray.length === 0) return;

    // Nama sheet maksimal 31 karakter
    const sheetName = sheetNameRaw.substring(0, 31);
    const sheet = workbook.addWorksheet(sheetName);

    // Ambil header dari objek pertama
    const headers = Object.keys(dataArray[0]);
    // // Tambahkan header khusus
    // headers.push("Jml DPJP Venti", "dr Venti Ke  ", "dr Utama Venti", "dr Raber Venti");

    // Tulis Header di baris pertama
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };

    // Tulis Data
    dataArray.forEach(obj => {
        const rowData = headers.map(header => obj[header] || "");
        sheet.addRow(rowData);
    });

    const startRow = 2;
    const numRows = dataArray.length;
    const lastDataRow = startRow + numRows - 1;

   // // Sisipkan rumus per baris (Konversi ke standar Excel: ',' untuk pemisah, '.' untuk desimal)
    // for (let i = 0; i < numRows; i++) {
    //     let rowNum = startRow + i;

    //     // Kolom BM = 65, BN = 66, BO = 67, BR = 70, BS = 71, BT = 72, BU = 73, BV = 74
    //     sheet.getCell(`BM${rowNum}`).value = { formula: `IF(ISNUMBER(SEARCH("${sheetName}",AG${rowNum})),1,BL${rowNum})` };

    //     sheet.getCell(`BN${rowNum}`).value = { formula: `ROUND(IF(BM${rowNum}=1,IF(BL${rowNum}=1,AZ${rowNum},IF(BL${rowNum}=2,AZ${rowNum}*60%,IF(BL${rowNum}=3,AZ${rowNum}*43.34%,IF(BL${rowNum}=4,AZ${rowNum}*35.02%,IF(BL${rowNum}=5,AZ${rowNum}*30%,IF(BL${rowNum}=6,AZ${rowNum}*26%,0)))))),0),0)` };

    //     sheet.getCell(`BO${rowNum}`).value = { formula: `ROUND(IF(BM${rowNum}>1,IF(BL${rowNum}=1,0,IF(BL${rowNum}=2,AZ${rowNum}*40%,IF(BL${rowNum}=3,AZ${rowNum}*28.33%,IF(BL${rowNum}=4,AZ${rowNum}*21.66%,IF(BL${rowNum}=5,AZ${rowNum}*17.5%,IF(BL${rowNum}=6,AZ${rowNum}*14.8%,0)))))),0),0)` };

    //     sheet.getCell(`BR${rowNum}`).value = { formula: `ROUND(IF(BQ${rowNum}=1, CHOOSE(BP${rowNum}, BC${rowNum}, BC${rowNum}*60%, BC${rowNum}*43.34%, BC${rowNum}*35.02%, BC${rowNum}*30%, BC${rowNum}*26%), IF(BQ${rowNum}>1, CHOOSE(BP${rowNum}, 0, BC${rowNum}*40%, BC${rowNum}*28.33%, BC${rowNum}*21.66%, BC${rowNum}*17.5%, BC${rowNum}*14.8%), 0)), 0)` };

    //     sheet.getCell(`BS${rowNum}`).value = { formula: `IF(BK${rowNum}=0,0,BL${rowNum})` };

    //     sheet.getCell(`BT${rowNum}`).value = { formula: `IF(BK${rowNum}=0,0,BM${rowNum})` };

    //     sheet.getCell(`BU${rowNum}`).value = { formula: `ROUND(IF(BT${rowNum}=1,IF(BS${rowNum}=1,BK${rowNum},IF(BS${rowNum}=2,BK${rowNum}*60%,IF(BS${rowNum}=3,BK${rowNum}*43.34%,IF(BS${rowNum}=4,BK${rowNum}*35.02%,IF(BS${rowNum}=5,BK${rowNum}*30%,IF(BS${rowNum}=6,BK${rowNum}*26%,0)))))),0),0)` };

    //     sheet.getCell(`BV${rowNum}`).value = { formula: `ROUND(IF(BT${rowNum}>1,IF(BS${rowNum}=1,0,IF(BS${rowNum}=2,BK${rowNum}*40%,IF(BS${rowNum}=3,BK${rowNum}*28.33%,IF(BS${rowNum}=4,BK${rowNum}*21.66%,IF(BS${rowNum}=5,BK${rowNum}*17.5%,IF(BS${rowNum}=6,BK${rowNum}*14.8%,0)))))),0),0)` };
    // }

    // --- BAGIAN BARU: RUMUS SUM DI BARIS TERAKHIR ---
    const sumRow = startRow + numRows;
    const startColAKIndex = 37; // AK adalah kolom ke-37
    const totalColsForSum = headers.length - startColAKIndex + 1;

    if (totalColsForSum > 0) {
        // Tulis "TOTAL" di kolom AJ (36)
        const totalCell = sheet.getCell(`AJ${sumRow}`);
        totalCell.value = "TOTAL";
        totalCell.font = { bold: true };

        // Buat rumus SUM dari kolom AK sampai akhir header
        for (let c = 0; c < totalColsForSum; c++) {
            let colIndex = startColAKIndex + c;
            let colLetter = sheet.getColumn(colIndex).letter; // Dapatkan huruf kolom (misal: AK, AL)

            let sumCell = sheet.getCell(`${colLetter}${sumRow}`);
            sumCell.value = { formula: `SUM(${colLetter}2:${colLetter}${lastDataRow})` };
            sumCell.font = { bold: true };
        }
    }
}

function generateSummarySheet(workbook) {
    const summarySheetName = "Rekap Total";

    // Hapus sheet rekap jika sudah ada sebelumnya (untuk skenario menimpa workbook)
    const existingSheet = workbook.getWorksheet(summarySheetName);
    if (existingSheet) {
        workbook.removeWorksheet(existingSheet.id);
    }

    // Buat Sheet baru di urutan pertama (index 0)
    const summarySheet = workbook.addWorksheet(summarySheetName);

    // Pindahkan ke index paling awal di exceljs workaround:
    workbook.worksheets.unshift(workbook.worksheets.pop());

    const targetCols = ["AN", "AY", "AZ", "BN", "BO", "BR", "BU", "BV"];
    const headers = ["Nama DPJP"].concat(targetCols.map(col => "Total " + col));

    summarySheet.addRow(headers);
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
    };

    let currentRow = 2;

    workbook.worksheets.forEach(sheet => {
        const sheetName = sheet.name;

        // Lewati sheet rekap
        if (sheetName === summarySheetName) return;

        const rowCount = sheet.rowCount;
        if (rowCount < 2) return;

        // Cari baris yang memiliki teks "TOTAL" di kolom AJ (36)
        let totalRow = rowCount;
        for (let r = rowCount; r > 0; r--) {
            if (sheet.getCell(`AJ${r}`).value === "TOTAL") {
                totalRow = r;
                break;
            }
        }

        // Siapkan data baris untuk sheet Rekap
        const rowData = [];

        // 1. Hyperlink ke Sheet yang dituju
        rowData[0] = {
            text: sheetName,
            hyperlink: `#'${sheetName}'!A1`
        };

        // 2. Referensi Formula ke kolom-kolom total
        targetCols.forEach((colLetter, index) => {
            // Menggunakan referensi langsung seperti ='Sheet1'!AN10
            rowData[index + 1] = { formula: `IFERROR('${sheetName}'!${colLetter}${totalRow}, 0)` };
        });

        summarySheet.addRow(rowData);
        currentRow++;
    });

    // Rapikan lebar kolom
    summarySheet.columns.forEach(column => {
        column.width = 15;
    });
}

// Jalankan skrip
importJSONtoSpreadsheet().catch(err => console.error("Terjadi kesalahan:", err));
# ICD-9 Most Used Codes REST API - Implementation Summary

## Overview
Created a new REST API endpoint to retrieve the most frequently used ICD-9 codes within a patient record date range.

---

## Changes Made

### 1. **Controller Update** - [controllers/icd.js](controllers/icd.js)

**New Function**: `getRecapICD9()`

- **Location**: Added after `getRecapICD10()` function
- **Functionality**: 
  - Accepts date range parameters (`from`, `until`) to query patient records
  - Optional `limit` parameter (default: 10, max: 100)
  - Aggregates diagnoses from outpatient records (`status = 'Ralan'`)
  - Counts frequency of each ICD-9 code
  - Ranks results by frequency (most used first)
  - Returns enriched data with ICD-9 descriptions

**Dependencies Updated**:
- Added `sequelize` to imports for aggregation functions
```javascript
const { Op, sequelize } = require("sequelize");
```

### 2. **Route Registration** - [routes/icd.js](routes/icd.js)

**New Route**: 
```javascript
routes.get('/recap/9', middleware.check, icd.getRecapICD9);
```

- **Endpoint**: `GET /api/icd/recap/9`
- **Authentication**: Required (`middleware.check`)
- **Query Parameters**: 
  - `from` (required): Start date (YYYY-MM-DD)
  - `until` (required): End date (YYYY-MM-DD)
  - `limit` (optional): Max results (default 10, max 100)

### 3. **Documentation** - [API_DOCS_ICD9_RECAP.md](API_DOCS_ICD9_RECAP.md)

Comprehensive API documentation including:
- Endpoint description
- Parameter specifications
- Request examples (cURL, JavaScript Fetch, Axios)
- Success and error response formats
- Usage notes and business use cases
- Implementation details
- Performance considerations

---

## Technical Details

### Database Query Flow

```
1. Query reg_periksa (patient records)
   ↓
   WHERE: tgl_registrasi BETWEEN 'from' AND 'until'
   ↓
2. Extract no_rawat values
   ↓
3. Query diagnosa_pasien
   ↓
   WHERE: no_rawat IN (...) AND status = 'Ralan'
   ↓
4. GROUP BY kd_penyakit
   ↓
   COUNT(*) as frequency
   ↓
5. ORDER BY frequency DESC
   ↓
6. LIMIT result_limit
   ↓
7. JOIN with icd9 table for descriptions
   ↓
8. Return ranked results
```

### Response Structure

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

---

## Usage Examples

### Basic Request
```bash
curl -X GET "http://localhost:3000/api/icd/recap/9?from=2024-01-01&until=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### With Custom Limit
```bash
curl -X GET "http://localhost:3000/api/icd/recap/9?from=2024-01-01&until=2024-12-31&limit=25" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript/Node.js
```javascript
const response = await fetch('/api/icd/recap/9', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token'
  }
});
const result = await response.json();
console.log(result.data); // Most used ICD-9 codes
```

---

## Features

✅ **Date Range Filtering**: Query patient records within specific date range  
✅ **Frequency Aggregation**: Automatically counts code usage  
✅ **Ranking**: Results sorted by frequency (most used first)  
✅ **Rich Descriptions**: Returns both short and long ICD-9 descriptions  
✅ **Pagination**: Configurable limit (default 10, max 100)  
✅ **Error Handling**: Comprehensive validation and error messages  
✅ **Authentication**: Protected by JWT middleware  
✅ **Consistent Format**: Follows Khanza API response pattern  

---

## Related Endpoints

- `GET /api/icd/recap/10` - Most used ICD-10 codes (existing)
- `GET /api/icd/9?search=xyz` - Search ICD-9 codes by text
- `GET /api/icd/9/:id` - Get specific ICD-9 code details

---

## Business Value

This endpoint enables:

1. **Hospital Analytics**
   - Identify most common outpatient diagnoses
   - Track disease trends over time
   
2. **Resource Planning**
   - Allocate staff based on disease frequency
   - Plan medical supplies
   
3. **Quality & Compliance**
   - Monitor coding patterns
   - Validate insurance claims
   
4. **Training & Development**
   - Focus staff training on common conditions
   - Identify knowledge gaps

---

## Performance Notes

- Works efficiently with proper database indices on:
  - `reg_periksa.tgl_registrasi`
  - `diagnosa_pasien.no_rawat`
  - `diagnosa_pasien.kd_penyakit`
  
- For large date ranges (1+ years), query may take several seconds
- Consider caching results for frequently requested date ranges

---

## Files Modified

| File | Type | Change |
|------|------|--------|
| [controllers/icd.js](controllers/icd.js) | Code | Added `getRecapICD9()` function + sequelize import |
| [routes/icd.js](routes/icd.js) | Code | Added route `/recap/9` |
| [API_DOCS_ICD9_RECAP.md](API_DOCS_ICD9_RECAP.md) | Documentation | New file with comprehensive API docs |

---

## Next Steps (Optional)

1. Add database indices for performance optimization
2. Implement caching for frequently accessed date ranges
3. Add filtering by clinic/ward (`kd_poli`, `kd_bangsal`)
4. Add filtering by doctor (`kd_dokter`)
5. Add export functionality (CSV, Excel)
6. Create analytics dashboard views


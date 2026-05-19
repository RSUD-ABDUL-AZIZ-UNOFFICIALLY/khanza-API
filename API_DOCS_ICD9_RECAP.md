## GET ICD-9 Most Used Codes (Recap)

### Endpoint
```
GET /api/icd/recap/9
```

### Authentication
- **Required**: Yes (JWT Bearer token via `middleware.check`)
- **Role**: Any authenticated user

### Description
Returns the most frequently used ICD-9 codes within a specified patient record date range. This endpoint aggregates diagnosis data from outpatient records and ranks ICD-9 codes by frequency of use.

---

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `from` | string (YYYY-MM-DD) | ✅ Yes | Start date for patient record search | `2024-01-01` |
| `until` | string (YYYY-MM-DD) | ✅ Yes | End date for patient record search | `2024-12-31` |
| `limit` | integer | ❌ No | Max number of results (default: 10, max: 100) | `20` |

---

## Request Example

### cURL
```bash
curl -X GET "http://localhost:3000/api/icd/recap/9?from=2024-01-01&until=2024-12-31&limit=15" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript (Fetch)
```javascript
const response = await fetch(
  'http://localhost:3000/api/icd/recap/9?from=2024-01-01&until=2024-12-31&limit=15',
  {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  }
);
const data = await response.json();
```

### Axios
```javascript
const response = await axios.get('/api/icd/recap/9', {
  params: {
    from: '2024-01-01',
    until: '2024-12-31',
    limit: 15
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

---

## Success Response (200 OK)

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
      "deskripsi_panjang": "Observation and examination of the eye and related structures",
      "total_penggunaan": 145
    },
    {
      "kode": "718.40",
      "deskripsi_pendek": "Effusion of joint",
      "deskripsi_panjang": "Effusion of joint, unspecified site",
      "total_penggunaan": 98
    },
    {
      "kode": "724.5",
      "deskripsi_pendek": "Backache",
      "deskripsi_panjang": "Backache, unspecified",
      "total_penggunaan": 87
    }
  ]
}
```

### Response Fields
- **status**: `true` (success)
- **message**: Human-readable status message
- **record**: Number of ICD-9 codes returned
- **date_range**: Object containing `from` and `until` dates used in query
- **data**: Array of ICD-9 codes ranked by frequency
  - **kode**: ICD-9 code
  - **deskripsi_pendek**: Short description
  - **deskripsi_panjang**: Long description
  - **total_penggunaan**: Number of times this code was used in diagnoses during the date range

---

## Error Responses

### 422 - Missing Required Parameters
```json
{
  "status": false,
  "message": "Parameters \"from\" and \"until\" are required (format: YYYY-MM-DD)",
  "data": null
}
```

### 200 - No Records Found
```json
{
  "status": true,
  "message": "No patient records found within date range",
  "record": 0,
  "data": []
}
```

### 500 - Server Error
```json
{
  "status": false,
  "message": "Internal Server Error",
  "data": "error details"
}
```

---

## Usage Notes

1. **Date Range**: Searches patient registration dates (`tgl_registrasi` in `reg_periksa`)
2. **Outpatient Only**: Only returns ICD-9 codes from outpatient diagnoses (`status = 'Ralan'`)
3. **Frequency Ranking**: Results are ordered by frequency (most used first)
4. **Limit Default**: If no limit is specified, returns top 10 codes
5. **Maximum Limit**: Cannot exceed 100 codes per request

---

## Business Use Cases

- **Hospital Analytics**: Identify most common outpatient conditions during a period
- **Resource Planning**: Allocate medical staff based on disease frequency
- **Quality Assurance**: Monitor disease trends and patterns
- **Training**: Focus staff training on most encountered conditions
- **Insurance Claims**: Validate claims frequency against diagnosis patterns

---

## Implementation Details

### Database Query Flow
1. Find all `reg_periksa` records within date range
2. Extract `no_rawat` values from those records
3. Find all `diagnosa_pasien` entries matching those records (outpatient only)
4. Aggregate by `kd_penyakit` and count occurrences
5. Sort by count DESC and limit results
6. Fetch ICD-9 details from `icd9` table for each code

### Performance Considerations
- For large date ranges (1+ years), query may take several seconds
- Consider adding database indices on:
  - `reg_periksa.tgl_registrasi`
  - `diagnosa_pasien.no_rawat`
  - `diagnosa_pasien.kd_penyakit`

---

## Related Endpoints

- `GET /api/icd/recap/10` - Same functionality for ICD-10 codes
- `GET /api/icd/9` - Search ICD-9 codes by text
- `GET /api/icd/9/:id` - Get detail of specific ICD-9 code

# API Documentation
<!--  -->
## Base URL
The API base URL depends on your environment:
- Local: `http://127.0.0.1:8000/api`
- Docker: `http://localhost/api`
<!--  -->
## Endpoints
<!--  -->
### 1. List Patients / Add Patient
**URL:** `/patients`
**Methods:** GET, POST
<!--  -->
#### GET /patients
Returns a paginated list of patients.
**Query Params:**
- `page` (optional, default=1) - page number
<!--  -->
**Response:**
```json
{
  "series": {
    "success": true,
    "result": {
      "page": 1,
      "total_pages": 3,
      "total_count": 42,
      "patients": [
        {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "dob": "1990-01-01",
          "sex": "male",
          "ethnic_background": "Caucasian"
        },
        ...
      ]
    }
  }
}
```
<!--  -->
#### POST /patients
Add a new patient.
**Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "dob": "1992-05-12",
  "sex": "female",
  "ethnic_background": "Asian"
}
```
<!--  -->
**Response:**
```json
{
  "series": {
    "success": true,
    "result": {
      "patient": {
        "id": 43,
        "first_name": "Jane",
        "last_name": "Doe",
        "dob": "1992-05-12",
        "sex": "female",
        "ethnic_background": "Asian"
      }
    }
  }
}
```
<!--  -->
### 2. Bulk Add Patients
Use it to populate the database with seed.json
**URL:** `/patients/bulk`
**Method:** POST
<!--  -->
Add multiple patients in a single request.
**Body:**
```json
[
  {
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-01-01",
    "sex": "male",
    "ethnic_background": "Caucasian"
  },
  {
    "first_name": "Jane",
    "last_name": "Doe",
    "dob": "1992-05-12",
    "sex": "female",
    "ethnic_background": "Asian"
  }
]
```
<!--  -->
**Response:**
```json
{
  "success": true,
  "patients": [
    { "id": 1, "first_name": "John", ... },
    { "id": 2, "first_name": "Jane", ... }
  ]
}
```
<!--  -->
### 3. Patient Detail / Delete
**URL:** `/patients/<int:pk>`
**Methods:** GET, DELETE
<!--  -->
#### GET /patients/<pk>
Returns a single patient by ID.
**Response:**
```json
{
  "series": {
    "success": true,
    "result": {
      "patient": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "dob": "1990-01-01",
        "sex": "male",
        "ethnic_background": "Caucasian"
      }
    }
  }
}
```
<!--  -->
#### DELETE /patients/<pk>
Deletes the patient and returns the deleted patient info.
**Response:**
```json
{
  "series": {
    "success": true,
    "result": {
      "patient": { ... }
    }
  }
}
```
<!--  -->
### 4. Process Patient
**URL:** `/patients/<int:pk>/process`
**Method:** POST
**Throttle:** `patient_process` (e.g., 5 requests/min per user or anonymous)
<!--  -->
Accepts weight and height and returns processed results.
**Body:**
```json
{
  "weight": { "value": 70, "unit": "kg" },
  "height": { "value": 175, "unit": "cm" }
}
```
<!--  -->
**Response:**
```json
{
  "success": true,
  "patient": {
    "weight": { "value": 70, "unit": "kg" },
    "height": { "value": 175, "unit": "cm" }
  },
  "results": [
    { "duration_30_m": 30, "concentration": 5.0 },
    { "duration_30_m": 60, "concentration": 10.0 }
  ]
}
```
<!--  -->
**Errors:**
- 404 if patient not found
- 400 if invalid weight/height payload
<!--  -->
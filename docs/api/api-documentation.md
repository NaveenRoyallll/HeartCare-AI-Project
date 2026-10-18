# CardioGuard AI — REST API Documentation

> [!IMPORTANT]
> **Base URL**: `/api/v1`  
> **Security Protocol**: All endpoints must be served over TLS 1.3 in production.  
> **Standard Headers**:
> - `Content-Type: application/json`
> - `Authorization: Bearer <JWT_ACCESS_TOKEN>` (for all authenticated endpoints)

---

## 1. Authentication & Identity Domain (`/auth`)

### 1.1 Register New Account
- **POST** `/auth/register`
- **Description**: Creates a new patient or physician account.
- **Auth**: None (Public)
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword!123",
  "full_name": "Jane Doe",
  "role": "patient", // "patient" | "doctor" | "admin"
  "phone_number": "+1234567890"
}
```
- **Responses**:
  - `201 Created`:
```json
{
  "id": "usr_9b1deb4d3b7d4ecf",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "role": "patient",
  "is_active": true,
  "created_at_utc": "2026-10-17T12:00:00Z"
}
```
  - `400 Bad Request`: Validation failure (weak password, invalid email format).
  - `409 Conflict`: Email already exists.

---

### 1.2 Login (OAuth2 Password Grant)
- **POST** `/auth/login`
- **Description**: Authenticates user credentials using Argon2id verification and returns JWT access and refresh tokens.
- **Auth**: None (Public)
- **Request Body** (`application/x-www-form-urlencoded` or JSON):
```json
{
  "username": "user@example.com",
  "password": "StrongPassword!123"
}
```
- **Responses**:
  - `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in_seconds": 3600,
  "user": {
    "id": "usr_9b1deb4d3b7d4ecf",
    "email": "user@example.com",
    "role": "patient",
    "full_name": "Jane Doe"
  }
}
```
  - `401 Unauthorized`: Invalid credentials or deactivated account.

---

### 1.3 Refresh Access Token
- **POST** `/auth/refresh`
- **Description**: Exchanges a valid refresh token for a fresh access token.
- **Auth**: Bearer Refresh Token
- **Responses**:
  - `200 OK`: `{"access_token": "...", "token_type": "bearer", "expires_in_seconds": 3600}`
  - `401 Unauthorized`: Expired or revoked refresh token.

---

## 2. User & Consent Domain (`/users`)

### 2.1 Get Current User Profile
- **GET** `/users/me`
- **Auth**: Bearer JWT (Patient / Doctor / Admin)
- **Responses**:
  - `200 OK`: Full user profile including role, onboarding status, and metadata.

### 2.2 Record Consent Agreement
- **POST** `/users/me/consent`
- **Auth**: Bearer JWT
- **Request Body**:
```json
{
  "terms_version": "v1.2",
  "privacy_policy_version": "v1.0",
  "data_processing_granted": true,
  "emergency_telemetry_granted": true
}
```
- **Responses**:
  - `200 OK`: `{"status": "recorded", "recorded_at_utc": "2026-10-17T12:05:00Z"}`

---

## 3. Vital Signs Domain (`/vitals`)

### 3.1 Record Vital Signs
- **POST** `/vitals`
- **Description**: Ingests patient biometric measurements, executes deterministic clinical rule checks, and runs anomaly detection against personal baselines.
- **Auth**: Bearer JWT (Patient)
- **Request Body**:
```json
{
  "systolic_bp": 128,
  "diastolic_bp": 82,
  "heart_rate": 72,
  "spo2": 98.5,
  "blood_glucose": 95.0,
  "measurement_context": "resting", // "resting" | "post_exercise" | "fasting"
  "recorded_at_utc": "2026-10-17T12:10:00Z"
}
```
- **Responses**:
  - `201 Created`:
```json
{
  "id": "vit_a89bc213",
  "systolic_bp": 128,
  "diastolic_bp": 82,
  "heart_rate": 72,
  "spo2": 98.5,
  "blood_glucose": 95.0,
  "clinical_category": "NORMAL",
  "requires_emergency_action": false,
  "anomaly_detected": false,
  "recorded_at_utc": "2026-10-17T12:10:00Z"
}
```
  - `422 Unprocessable Entity`: Value out of physiological limits (e.g., Heart Rate < 20 or > 300).

---

### 3.2 List Patient Vital History
- **GET** `/vitals`
- **Description**: Returns paginated vital signs history for the authenticated patient or an authorized physician.
- **Auth**: Bearer JWT
- **Query Parameters**:
  - `start_date` (ISO-8601, optional)
  - `end_date` (ISO-8601, optional)
  - `limit` (integer, default: 50, max: 200)
  - `offset` (integer, default: 0)
- **Responses**:
  - `200 OK`:
```json
{
  "items": [ /* vital items */ ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

---

## 4. Cardiovascular Risk Assessment Domain (`/risk`)

### 4.1 Calculate Framingham 10-Year CVD Risk
- **POST** `/risk/calculate`
- **Description**: Computes 10-year cardiovascular risk percentage using the Framingham General Cardiovascular Risk Profile (D'Agostino et al., 2008).
- **Auth**: Bearer JWT
- **Request Body**:
```json
{
  "age": 52,
  "gender": "male", // "male" | "female"
  "total_cholesterol_mg_dl": 210.0,
  "hdl_cholesterol_mg_dl": 45.0,
  "systolic_bp": 138,
  "is_treated_bp": true,
  "is_smoker": false,
  "has_diabetes": false
}
```
- **Responses**:
  - `200 OK`:
```json
{
  "risk_score_percentage": 14.8,
  "risk_category": "MODERATE", // "LOW" (<10%) | "MODERATE" (10-19%) | "HIGH" (>=20%)
  "heart_age_years": 59,
  "calculated_at_utc": "2026-10-17T12:15:00Z",
  "disclaimer": "Framingham Risk Score is an epidemiological estimate intended for clinical education. It is not a diagnostic test. Discuss risk factors with your healthcare provider."
}
```
  - `400 Bad Request`: Age outside valid range (30 to 74 years).

---

## 5. Emergency Protocol Domain (`/emergency`)

### 5.1 Log Emergency Event Telemetry
- **POST** `/emergency/log`
- **Description**: Asynchronously logs emergency events triggered by the mobile client, notifying emergency contacts if configured.
- **Auth**: Bearer JWT (Optional fallback for disconnected clients)
- **Request Body**:
```json
{
  "trigger_source": "MANUAL_SOS_BUTTON", // "MANUAL_SOS_BUTTON" | "CRITICAL_VITALS_RULE" | "ASSISTANT_OVERRIDE"
  "symptoms": ["chest_tightness", "sweating", "dyspnea"],
  "call_dispatched": true,
  "emergency_number_called": "112",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "client_timestamp_utc": "2026-10-17T12:20:00Z"
}
```
- **Responses**:
  - `202 Accepted`:
```json
{
  "event_id": "emg_4f1c90a2",
  "contacts_notified": 2,
  "status": "LOGGED"
}
```

---

## 6. Doctor-Patient Collaboration Domain (`/doctor`)

### 6.1 Request Patient Access
- **POST** `/doctor/access-requests`
- **Description**: Physician requests time-limited, revocable access to a patient's records.
- **Auth**: Bearer JWT (Doctor role only)
- **Request Body**:
```json
{
  "patient_email": "patient@example.com",
  "reason_for_access": "Routine cardiology consultation"
}
```
- **Responses**:
  - `202 Accepted`: `{"request_id": "req_88a91b", "status": "PENDING"}`

### 6.2 Patient Grant / Revoke Access
- **PATCH** `/doctor/access-requests/{request_id}`
- **Auth**: Bearer JWT (Patient role only)
- **Request Body**:
```json
{
  "action": "GRANT", // "GRANT" | "REVOKE"
  "valid_days": 30
}
```
- **Responses**:
  - `200 OK`: `{"request_id": "req_88a91b", "status": "ACTIVE", "expires_at_utc": "2026-11-16T12:00:00Z"}`

---

## 7. AI Health Assistant Domain (`/assistant`)

### 7.1 Submit Educational Health Query
- **POST** `/assistant/chat`
- **Description**: Natural language question routing with deterministic emergency pre-filtering and anti-reassurance post-filtering.
- **Auth**: Bearer JWT
- **Request Body**:
```json
{
  "message": "What is the difference between systolic and diastolic blood pressure?"
}
```
- **Responses**:
  - `200 OK`:
```json
{
  "reply": "Systolic pressure is the pressure in your arteries when your heart muscle contracts...",
  "safety_triggered": false,
  "disclaimer": "This information is for educational purposes only and not a substitute for clinical medical advice."
}
```
  - `200 OK (Emergency Override Triggered)`:
```json
{
  "reply": "URGENT MEDICAL WARNING: Your query describes symptoms that may indicate a cardiovascular emergency. Stop physical activity and immediately call emergency services (112 / 911).",
  "safety_triggered": true,
  "emergency_action_required": true
}
```

---

## 8. Standard Error Responses

All API error responses conform to RFC 7807 problem details:

```json
{
  "error_code": "RESOURCE_NOT_FOUND",
  "message": "The requested patient record could not be found.",
  "details": {},
  "timestamp_utc": "2026-10-17T12:25:00Z"
}
```

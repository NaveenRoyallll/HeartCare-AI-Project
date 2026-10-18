# CardioGuard AI — Data Flow Specifications

> [!IMPORTANT]
> **Safety Notice**: All workflows enforce explicit patient consent and data privacy. Emergency guidance pathways are engineered for immediate local response to bypass network lag during life-threatening events.

---

## 1. User Registration & Onboarding Flow

This sequence handles secure account creation for both Patients and Physicians, ensuring cryptographic password hashing, role assignment, and mandatory clinical consent acceptance.

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient / Doctor
    participant Client as Mobile App / Web Portal
    participant API as FastAPI Backend
    participant Auth as Auth & RBAC Service
    participant DB as Database (PostgreSQL)

    User->>Client: Enters Email, Password, Full Name, Role
    Client->>Client: Validate format (password strength, email regex)
    Client->>API: POST /api/v1/auth/register (payload)
    API->>Auth: Hash password with Argon2id
    Auth->>DB: Check if email already exists
    alt Email already registered
        DB-->>Auth: Conflict detected
        Auth-->>API: 409 Conflict
        API-->>Client: "Email already registered"
    else New User
        Auth->>DB: INSERT into users (email, hashed_pw, role, is_active=True)
        DB-->>Auth: User record created
        Auth->>DB: INSERT audit log (USER_REGISTERED, UTC timestamp)
        Auth-->>API: User entity
        API-->>Client: 201 Created (User profile metadata)
    end
    User->>Client: Accepts Medical Terms & Privacy Consent
    Client->>API: POST /api/v1/users/me/consent (consent_version, granted=True)
    API->>DB: INSERT into user_consents (user_id, terms_version, granted_at_utc)
    API-->>Client: 200 OK (Consent confirmed)
```

---

## 2. Vital Sign Recording & Anomaly Detection Flow

When a user logs a vital sign (e.g., Blood Pressure, Heart Rate, SpO2, Blood Glucose), the data is validated against physical bounds, evaluated against deterministic danger limits, checked against their personal statistical baseline, and stored.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant Mobile as Mobile App
    participant API as FastAPI Backend
    participant Rules as Clinical Rule Engine
    participant Anomaly as Statistical Anomaly Engine
    participant DB as Database

    Patient->>Mobile: Input systolic=185, diastolic=122, heart_rate=98
    Mobile->>Mobile: Client validation (numeric range sanity check)
    Mobile->>API: POST /api/v1/vitals/ (systolic, diastolic, heart_rate, timestamp)
    API->>Rules: Check deterministic danger thresholds (Hypertensive Crisis check)
    
    alt Hypertensive Crisis Detected (Systolic >= 180 or Diastolic >= 120)
        Rules-->>API: Severity: CRITICAL (Danger Alert)
        API->>DB: INSERT into vitals (values, severity='CRITICAL')
        API-->>Mobile: 201 Created + Red Alert Payload ("Seek Emergency Care Immediately")
        Mobile->>Patient: Display Red Urgent Guidance Screen (No reassuring AI)
    else Normal / Stage 1 / Stage 2 Range
        Rules-->>API: Severity: NORMAL / ELEVATED
        API->>DB: Fetch last 30 days of patient baseline vitals
        DB-->>API: Historical vital series
        API->>Anomaly: Compute rolling Z-score & IQR bounds
        Anomaly-->>API: Anomaly status (e.g., is_anomaly=False, z_score=+0.8)
        API->>DB: INSERT into vitals (values, severity, anomaly_flags)
        API-->>Mobile: 201 Created (Recorded successfully + trend summary)
        Mobile->>Patient: Display recorded vital & trend chart
    end
```

---

## 3. Cardiovascular Risk Assessment Flow (Framingham)

Calculates the 10-year risk of developing cardiovascular disease using the standardized Framingham Heart Study equation (D’Agostino et al., 2008).

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant Client as Mobile App / Web
    participant API as FastAPI Backend
    participant RiskEngine as Framingham Risk Engine
    participant DB as Database

    Patient->>Client: Open Risk Assessment Form
    Client->>API: GET /api/v1/vitals/latest (Auto-fill latest SBP, TC, HDL)
    API->>DB: Query latest recorded biometric values
    DB-->>API: Biometric record
    API-->>Client: Pre-filled values (editable)
    Patient->>Client: Review & Submit (Age, Gender, SBP, Smoker, Diabetes, TC, HDL, Treated BP)
    Client->>API: POST /api/v1/risk/calculate (Clinical Parameters)
    API->>RiskEngine: Evaluate D'Agostino et al. Cox proportional hazards formula
    RiskEngine-->>API: Risk % (e.g., 14.2%), Category (Moderate), Heart Age (58)
    API->>DB: INSERT into risk_assessments (patient_id, risk_percentage, category, calculated_at)
    API-->>Client: 200 OK (Calculated score, breakdown, clinical disclaimer)
    Client->>Patient: Render Risk Gauge + Mandatory Research Disclaimer
```

---

## 4. Emergency Guidance Flow (Zero Latency & Offline-Ready)

Emergency triage must be instantaneous. The mobile application evaluates critical red-flag symptoms locally without waiting for server responses.

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant MobileUI as Mobile UI
    participant LocalCache as Local Safety Engine (Mobile)
    participant Telephony as Device Phone / Dialer
    participant API as Backend (Async Telemetry)
    participant DB as Database

    Patient->>MobileUI: Taps Emergency SOS Button
    MobileUI->>LocalCache: Query hardcoded emergency rules (Immediate render)
    LocalCache-->>MobileUI: Render Emergency Screen (< 100ms)
    Patient->>MobileUI: Selects symptoms: "Crushing chest pain radiating to left arm"
    LocalCache->>LocalCache: Red-flag pattern matched: "Acute Coronary Syndrome"
    MobileUI->>Patient: HIGH URGENCY: "Call Emergency Services Now"
    Patient->>MobileUI: Taps "Call 112 / 911"
    MobileUI->>Telephony: Trigger native phone dialer with emergency dispatch number
    
    par Asynchronous Logging
        MobileUI-)API: POST /api/v1/emergency/log (symptoms, timestamp, call_initiated)
        API-)DB: INSERT into emergency_logs & alert primary emergency contacts via SMS/webhook
    end
```

---

## 5. Doctor Access & Patient Consent Flow

Data isolation mandates that doctors cannot view any patient's records without explicit, revocable patient authorization.

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Doctor
    participant DocPortal as Doctor Dashboard
    actor Patient as Patient
    participant Mobile as Patient Mobile App
    participant API as FastAPI Backend
    participant DB as Database

    Doctor->>DocPortal: Searches patient by unique Health ID / Email
    DocPortal->>API: POST /api/v1/doctor/access-requests (patient_identifier)
    API->>DB: Verify Doctor is verified (license_verified=True)
    API->>DB: INSERT into access_requests (doctor_id, patient_id, status='PENDING')
    API-->>DocPortal: 202 Accepted (Request Sent)
    
    API-)Mobile: Push Notification ("Dr. Rao requested access to your vitals")
    Patient->>Mobile: Reviews access request (Doctor name, clinic, expiration)
    Patient->>Mobile: Taps "Approve Access"
    Mobile->>API: POST /api/v1/patient/consent/grant (request_id, duration_days=30)
    API->>DB: UPDATE access_requests SET status='ACTIVE', expires_at=NOW() + 30 days
    API->>DB: INSERT into audit_logs (PATIENT_CONSENT_GRANTED, doctor_id, patient_id)
    API-->>Mobile: 200 OK (Consent granted)
    
    Doctor->>DocPortal: Refreshes Patient View
    DocPortal->>API: GET /api/v1/doctor/patients/{patient_id}/vitals
    API->>DB: Verify active non-expired consent token
    DB-->>API: Valid authorization verified
    API->>DB: SELECT vitals, risk_history FROM records WHERE patient_id=X
    DB-->>API: Clinical data records
    API->>DB: INSERT into audit_logs (DOCTOR_RECORD_ACCESSED, doctor_id, patient_id)
    API-->>DocPortal: 200 OK (Patient Vitals & Risk Trends)
    DocPortal->>Doctor: Render Longitudinal Patient EHR View
```

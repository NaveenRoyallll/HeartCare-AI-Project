# CardioGuard AI — Product User Flows

This document details the primary end-user interaction pathways across the CardioGuard AI mobile application and web dashboard.

---

## 1. Registration, Onboarding & Terms Consent Flow

```mermaid
flowchart TD
    Start([Launch Mobile App]) --> RegScreen[Register Screen]
    RegScreen --> InputDetails[Enter Email, Password, Name]
    InputDetails --> ClientValidate{Password Meets\nSecurity Policy?}
    ClientValidate -->|No| FixPW[Show Validation Hint] --> InputDetails
    ClientValidate -->|Yes| SubmitReg[Submit POST /auth/register]
    SubmitReg --> ServerCheck{Email Unique?}
    ServerCheck -->|Conflict| ShowConflict[Display Email Already Registered] --> RegScreen
    ServerCheck -->|Success| ConsentScreen[Display Mandatory Medical Terms & Consent]
    ConsentScreen --> ReviewConsent[Patient Reviews Privacy & Emergency Terms]
    ReviewConsent --> AcceptCheck{User Accepts\nConsent?}
    AcceptCheck -->|No| BlockAccess[Exit App / Restrict Functionality]
    AcceptCheck -->|Yes| RecordConsent[POST /users/me/consent]
    RecordConsent --> MainDash([Enter Patient Dashboard])
```

---

## 2. Vital Sign Recording & Trend Review Flow

```mermaid
flowchart TD
    Dash([Patient Dashboard]) --> TapRecord[Tap '+ Record Vitals']
    TapRecord --> VitalForm[Enter Systolic, Diastolic, Heart Rate, Glucose]
    VitalForm --> SubmitVital[Submit POST /vitals]
    SubmitVital --> SafetyCheck{Hypertensive Crisis?\nSBP >= 180 or DBP >= 120}
    
    SafetyCheck -->|Yes| RedBanner[DISPLAY RED URGENT ALERT\nInstruct Immediate Retest / 112 Call]
    SafetyCheck -->|No| AnomalyCheck{Baseline Outlier?\n|Z| > 3.0}
    
    AnomalyCheck -->|Yes| YellowNote[Save Vital + Suggest Rest & Retest]
    AnomalyCheck -->|No| NormalSave[Save Vital with Normal Category]
    
    RedBanner --> EmergencyOption{User chooses action}
    EmergencyOption --> TapCall[Tap Call Emergency]
    EmergencyOption --> TapDismiss[User Dismisses Alert]
    
    YellowNote --> ViewTrends[Render 30-Day Trend Visualizations]
    NormalSave --> ViewTrends
    ViewTrends --> Dash
```

---

## 3. Cardiovascular Risk Assessment Flow

```mermaid
flowchart TD
    Nav([Dashboard]) --> RiskTab[Navigate to Risk Assessment]
    RiskTab --> FetchLatest[Pre-populate form with latest SBP & Lab values]
    FetchLatest --> UserReview[User updates Age, Smoker status, Diabetes, TC, HDL]
    UserReview --> SubmitCalc[Tap 'Calculate 10-Year CVD Risk']
    SubmitCalc --> ValidateLimits{Age 30 - 74 & Valid Lab Range?}
    ValidateLimits -->|No| FixParams[Display Specific Parameter Out of Range] --> UserReview
    ValidateLimits -->|Yes| ComputeFramingham[Backend computes Framingham Score]
    ComputeFramingham --> DisplayScore[Render Risk Dial & Vascular Heart Age]
    DisplayScore --> ShowCaveat[Display Mandatory South Asian & Educational Disclaimer]
    ShowCaveat --> SaveHistory[Persist in Patient Risk History]
```

---

## 4. Emergency Action Flow (Instant & Offline)

```mermaid
flowchart TD
    AnyScreen([Any App Screen]) --> SOSButton[Tap Emergency SOS Button]
    SOSButton --> LoadScreen[Render Local Offline Emergency View\n< 50ms Latency]
    LoadScreen --> QuickCheck[Optional Symptom Checklist\nChest Pain / Arm Radiation / Shortness of Breath]
    QuickCheck --> ActionChoice{Patient Action}
    
    ActionChoice --> DirectCall[Tap 'Call 112 / 911']
    DirectCall --> OSCall[Launch Native Telephone Dialer]
    
    ActionChoice --> NotifyContacts[Tap 'Alert Emergency Contacts']
    NotifyContacts --> SendSMS[Dispatch SMS with GPS Coordinates]
    
    OSCall --> PostLog[Asynchronously POST /emergency/log]
    SendSMS --> PostLog
    PostLog --> ReturnHome([Return to Dashboard])
```

---

## 5. Doctor Access Request & Patient Consent Approval Flow

```mermaid
flowchart TD
    subgraph DoctorActions["Doctor Web Dashboard"]
        DocLogin[Doctor Logs In] --> SearchPatient[Search Patient by Email / ID]
        SearchPatient --> RequestAccess[POST /doctor/access-requests\nSubmit Consultation Justification]
        RequestAccess --> WaitApproval[Status: PENDING]
    end

    subgraph PatientActions["Patient Mobile App"]
        PushNotice[Receive Push Notification:\n'Dr. Rao requested record access']
        PushNotice --> OpenReview[Open Access Permissions Screen]
        OpenReview --> DecideConsent{Approve or Decline?}
        DecideConsent -->|Decline| RejectAPI[PATCH /doctor/access-requests: REJECT]
        DecideConsent -->|Approve| GrantAPI[PATCH /doctor/access-requests: GRANT 30 Days]
    end

    subgraph AccessGranted["Authorized Clinical Access"]
        GrantAPI --> UpdateStatus[Status: ACTIVE]
        UpdateStatus --> DocRefresh[Doctor Dashboard Auto-refreshes]
        DocRefresh --> DocView[Physician Views Longitudinal BP & Risk Records]
        DocView --> AuditRecord[Audit Log Generated: RECORD_VIEWED]
    end

    WaitApproval -.-> PushNotice
```

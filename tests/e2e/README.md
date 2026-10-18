# CardioGuard AI — End-to-End (E2E) Test Plan

> [!IMPORTANT]
> **Test Objective**: Validate seamless integration between mobile clients (React Native / Expo), physician web dashboards (Next.js), and backend API services (FastAPI) across critical clinical user journeys.

---

## 1. Test Automation Framework

- **Web Portal Testing**: Playwright (TypeScript) simulating physician authentication, patient search, and longitudinal graph interactions.
- **Mobile Application Testing**: Maestro / Detox for automated cross-platform mobile flows.
- **Backend Mock Infrastructure**: Isolated Docker Compose environment with synthetic clinical test fixtures.

---

## 2. Priority E2E Test Scenarios

### Scenario E2E-01: Full Patient Registration, Consent, and Initial Vital Entry
1. Register new patient account with valid credentials.
2. Accept medical disclaimer and data processing terms.
3. Submit initial resting blood pressure reading ($124/82\text{ mmHg}$).
4. Verify reading appears on mobile dashboard trend view.
5. Verify audit log entry `VITAL_RECORDED` is created in database.

### Scenario E2E-02: Hypertensive Crisis Red Alert Flow
1. Patient inputs SBP: $185\text{ mmHg}$, DBP: $122\text{ mmHg}$.
2. Assert immediate modal alert is presented on mobile screen with red styling.
3. Assert system warns against strenuous physical activity.
4. Verify patient can launch native phone dialer with emergency dispatch shortcut.
5. Verify backend logs the high-acuity event with status `CRITICAL`.

### Scenario E2E-03: Doctor Access Request & Patient Approval Lifecycle
1. Doctor logs into Next.js dashboard.
2. Doctor searches patient by email and submits access request.
3. Mobile client receives notification / access prompt.
4. Patient clicks "Approve Access" for 30 days.
5. Doctor refreshes dashboard and verifies unlocked longitudinal charts.
6. Patient clicks "Revoke Access"; doctor dashboard immediately displays `403 Forbidden` on subsequent API calls.

### Scenario E2E-04: Health Assistant Emergency Red-Flag Invalidation
1. Patient opens conversational health assistant.
2. Patient sends: *"I have acute tightness in my chest and pain in my left arm."*
3. Assert system does NOT generate conversational LLM banter.
4. Assert system returns deterministic emergency guidance within $200\text{ ms}$.

---

## 3. Running E2E Test Suites Locally

```bash
# Start test environment stack
docker-compose -f docker-compose.test.yml up -d

# Run Web Dashboard Playwright Suite
cd tests/e2e/web
npm install
npx playwright test

# Run Mobile Flow with Maestro
cd tests/e2e/mobile
maestro test flows/emergency_flow.yaml
```

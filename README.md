# CardioGuard AI

CardioGuard AI is an MVP for patient cardiovascular tracking, deterministic emergency guidance, and a clinician dashboard. It is not a diagnostic device and does not replace emergency services or a licensed clinician.

## Local Windows setup

These commands use Windows PowerShell and run the backend without Docker.

### Backend

```powershell
Set-Location "D:\Code PlayGround\HeartCare AI Project"
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m pip install -r ai\requirements.txt

Set-Location backend
alembic upgrade head
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The local SQLite database is `backend\cardioguard.db`. Copy `backend\.env.example` to `backend\.env` and update values before using non-development credentials or services. The development configuration leaves the LLM provider unset; emergency triage remains deterministic and does not require an AI service.

For doctor development access, set a private `DOCTOR_PROVISIONING_TOKEN` in
`backend\.env`. Use that token with `POST /api/v1/auth/provision-doctor`, then
verify the returned account with an admin account through
`POST /api/v1/admin/doctors/{doctor_id}/verify`. Public registration never
creates doctor accounts.

### Doctor dashboard

In a second PowerShell window:

```powershell
Set-Location "D:\Code PlayGround\HeartCare AI Project\frontend\doctor-dashboard"
npm install
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1"
npm run dev
```

Open <http://localhost:3000>.

Production validation:

```powershell
npm run lint
npm run build
npm run start
```

### Mobile app

In another PowerShell window:

```powershell
Set-Location "D:\Code PlayGround\HeartCare AI Project\frontend\mobile"
npm install
npm start
```

For an Android emulator, the development API URL uses `10.0.2.2` to reach the host machine. For a physical device, configure the API base URL to the host's LAN address.

## API smoke-test flow

The backend exposes:

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/vitals/`
- `GET /api/v1/health/dashboard`
- `POST /api/v1/emergency/check-symptoms`

Public registration always creates a `patient` account. Doctor routes require a JWT with the `doctor` or `admin` role.

## Testing

```powershell
Set-Location "D:\Code PlayGround\HeartCare AI Project"
$env:PYTHONPATH = "."

Set-Location backend
pytest -q
alembic upgrade head

Set-Location ..\ai
pytest -q

Set-Location frontend\doctor-dashboard
npm run lint
npm run build

Set-Location ..\mobile
npx tsc --noEmit
```

Set `NEXT_PUBLIC_DEMO_MODE=true` only when intentionally running the dashboard
with synthetic demo data. Normal dashboard paths surface backend errors rather
than silently falling back to mock data. For the mobile app, set
`EXPO_PUBLIC_API_URL` when the default emulator URL is not suitable:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://10.0.2.2:8000/api/v1"
npm start
```

No real patient records, production credentials, or fabricated clinical results
are included in this repository. Binary report uploads remain pending manual
review until a validated OCR/parser service is configured. Values in
development fixtures are synthetic and must not be used for clinical decisions.

# Collably (Creator Collaboration Platform) - frontend prototype

React + TypeScript + Vite + Tailwind v4 + React Router + Recharts. No backend: all data is seeded mock data kept in React Context and persisted to localStorage (`collably-demo-v1`). Use "Reset demo" in the top bar to restore the seed.

    npm install
    npm run dev          # http://localhost:5173
    npm run typecheck

## Demo login
Login page has one-click buttons: demo-brand@collably.test (Nova Beauty), demo-creator@collably.test (Priya Mehta), demo-admin@collably.test. The top-bar role switcher changes role without logging out. This is simulated; there is no real authentication.

## Demo flow (matches the activity diagram)
1. Brand: Discover, save a creator, invite to "Summer Glow" (or create a new campaign and launch it).
2. Switch to Creator (Priya): Overview shows the invitation. Accept or reject.
3. Creator: open the collaboration, submit a deliverable URL.
4. Brand: Campaigns > Summer Glow, start review, approve or request a revision. Creator resubmits.
5. When every deliverable is approved the collaboration, then the campaign, becomes completed.

## Structure
`src/types.ts` entities and status unions; `src/data.ts` seed; `src/store.tsx` state, service-style actions (inviteCreator, respond, submit, review, send...) and selectors; `src/pages/*` screens; `src/ui.tsx` shared components.

## Limitations / backend later
Payments, social APIs, ratings, file uploads and real auth are TBD in the SRS and are not simulated. A backend needs users/roles, creators, campaigns, collaborations (D4), deliverables, messages and notifications (D5) endpoints; replace the actions in `store.tsx` with API calls.

## Added routes
/register, /forgot-password (simulated), /brand/creators/:id (profile + portfolio), /brand/settings, /creator/portfolio (add, edit, delete), /creator/settings, /admin/campaigns.

## File uploads (MVP)

Creator portfolio items and collaboration deliverables can now include uploaded files in addition to external links. The API accepts images (JPEG, PNG, WebP, GIF), MP4/WebM videos, and PDFs up to 25 MB. Files are stored locally in `backend/uploads` by default and served at `/uploads/...`.


This local storage is suitable for development and demos only. Before production deployment, configure durable cloud storage (such as S3-compatible storage or Cloudinary), enforce storage quotas, and add content scanning and stronger file-signature validation.


Install the backend dependencies including `python-multipart`:


```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Email integration (Resend)

Collably sends email verification, password-reset, and campaign invitation emails through Resend.

1. Create a Resend account and API key. Verify your sending domain for production.
2. Copy `backend/.env.example` to `backend/.env` and set `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`, and `COLLABLY_SECRET`.
3. Load environment variables before running FastAPI (PowerShell example):
   ```powershell
   Get-Content backend/.env | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object { $name,$value = $_ -split '=',2; Set-Item -Path Env:$name -Value $value }
   uvicorn main:app --reload --port 8000
   ```
4. With no Resend key, email messages and verification/reset links are logged by the backend for local development. Configure Resend to deliver actual emails.

Email verification links expire in 24 hours; password reset links expire in one hour. Tokens are stored as SHA-256 hashes and are single-use.

Routes added: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/verify-email`, and `POST /api/auth/resend-verification`.

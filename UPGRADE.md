# Collably backend upgrade

1. Copy everything from this zip into your Collably project folder (the one with package.json). Say "Replace" for src/store.tsx. You should now have a `backend` folder next to `src`.
2. In the project root run: `python upgrade_frontend.py` (use `python3` on macOS/Linux). It edits four files and deletes src/data.ts. If it reports missing text, nothing was changed; send me the message.
3. Start the backend (needs Python 3.10 or newer):

       cd backend
       python -m venv .venv
       .venv\Scripts\activate          (macOS/Linux: source .venv/bin/activate)
       pip install -r requirements.txt
       pytest                          (optional, checks the invite-to-approval flow)
       uvicorn main:app --reload --port 8000

   API docs: http://localhost:8000/docs. The SQLite file collably.db is created and seeded on the first start.
4. In a second terminal, in the project root: `npm run dev` and open http://localhost:5173.

Sign in with demo-brand@collably.test, demo-creator@collably.test or demo-admin@collably.test (password demo1234), or register a new account. Open two browsers (one brand, one creator): changes show up for the other person within about 5 seconds.

Server rules live in backend/main.py: roles and ownership are checked on every endpoint, invitation and review steps can only happen in the allowed order, and passwords are hashed. "Reset demo" wipes the database back to sample data (set COLLABLY_DEV=0 to disable it).

Not done yet: real email for password reset, file uploads, WebSockets, payments, rate limiting, database migrations, deployment. Before deploying set COLLABLY_SECRET, COLLABLY_DEV=0 and a PostgreSQL DATABASE_URL.

## MVP improvements added in this build

- Creator onboarding collects niche, bio, location, social platforms, self-reported audience/engagement, and an optional rate range.
- New creator profiles are routed through setup before the creator dashboard.
- Creators can browse active campaigns from the creator navigation. Campaigns in review are also discoverable.
- Existing creator metrics are explicitly labelled self-reported.
- Creator profile fields are added to existing SQLite databases with a lightweight additive migration.

This build is an initial feature milestone; campaign applications, real file uploads, and email workflows are not implemented yet.

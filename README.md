# Collably

Collably connects brands and creators for campaign invitations, deliverable submission, and review. The frontend uses React and Vite. The API uses FastAPI and SQLAlchemy.

## Run locally

Start the API from the `backend` directory:

```sh
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

From the repository root, run `npm ci` and `npm run dev`, then open http://localhost:5173.

Local development defaults to SQLite and seeds fictional demo accounts. The sign-in page offers a brand, creator, and admin demo. Demo reset clears the local database. Set `COLLABLY_DEV=0` before starting the API to disable demo seeding and reset.

Run `python -m pytest` from `backend` and `npm run typecheck` and `npm run build` from the root.

## Deploy on Vercel with Neon

1. Link the repository root to a Vercel project. The Services configuration deploys Vite and FastAPI together on the same domain.
2. Connect a new Neon Postgres resource to the project's production environment so Vercel injects `DATABASE_URL`. Keep the SSL parameters from the Neon connection string.
3. Set the sensitive `COLLABLY_SECRET` environment variable to a randomly generated value of at least 32 characters.
4. Run `vercel deploy --prod` from the root and check `/api/health` on the deployed domain. The API initializes its tables on startup. Production starts with an empty database.

Portfolio and deliverable uploads persist in the configured database. The maximum is 4 MB on Vercel and 25 MB in local development. Use an external link for larger files.

## Transactional email

Set `RESEND_API_KEY` and `EMAIL_FROM` with a verified sending domain to enable verification, password-reset, and campaign-invitation emails. Use `FRONTEND_URL` for a custom domain if needed. On Vercel, links default to the project's deployment domain. Without Resend, new users can register and sign in and invitations remain available in the app.

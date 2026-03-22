# Tracer Study API (email OTP + insert proxy)

This service adds **email OTP** and a secured **`POST /insert`** that forwards to your existing insert URL after verifying a short-lived JWT.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health / info |
| POST | `/request-otp` | Body: `{ "email": "..." }` — sends 6-digit code |
| POST | `/verify-otp` | Body: `{ "email": "...", "code": "123456" }` — returns `emailVerificationToken` |
| POST | `/insert` | Same body as your form **plus** `emailVerificationToken`; token is removed before upstream call |

## Environment variables

Copy `.env.example` to `.env` locally. On Render, set variables in the dashboard.

- **`JWT_SECRET`** — long random string (required in production).
- **`OTP_SECRET`** — optional; defaults to `JWT_SECRET`.
- **`UPSTREAM_INSERT_URL`** — your existing API, e.g. `https://backend-1-wsky.onrender.com/insert`.
- **`RESEND_API_KEY`** — from [Resend](https://resend.com). If omitted, the OTP is **only printed in server logs** (for local dev).
- **`RESEND_FROM`** — verified sender, e.g. `Tracer Study <onboarding@resend.dev>`.
- **`CORS_ORIGIN`** — `*` or comma-separated frontend origins (e.g. `https://yoursite.pages.dev,http://localhost:5500`).
- **`PORT`** — Render sets this automatically.

## Local run

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET; for real email set RESEND_API_KEY
npm start
```

## Frontend

In [`pages/forms.html`](../pages/forms.html), set `window.TRACER_API_BASE` to this service’s public URL **before** `script.js` loads:

```html
<script>
  window.TRACER_API_BASE = "https://your-service.onrender.com";
</script>
```

For local testing with the default in the repo:

```html
<script>
  window.TRACER_API_BASE = "http://localhost:3000";
</script>
```

## Deploy on Render

1. **Option A — Blueprint:** Connect the repo and use [`render.yaml`](../render.yaml) (set `UPSTREAM_INSERT_URL` in the dashboard if not prompted).
2. **Option B — Manual:** New **Web Service**, root directory `backend`, build `npm install`, start `npm start`.
3. Set env vars: `JWT_SECRET`, **`UPSTREAM_INSERT_URL`**, `RESEND_API_KEY`, `RESEND_FROM`, `CORS_ORIGIN`.
4. In hosted `forms.html`, set `window.TRACER_API_BASE` to this service’s URL (**origin only**, no `/insert`).

### One domain vs two services

- **`TRACER_API_BASE` in `forms.html`** must be the **origin only**: `https://your-api.onrender.com` (no `/insert`).
- If this OTP app and your **legacy** insert are on **different** Render services, set `UPSTREAM_INSERT_URL` to the **legacy** `https://.../insert` URL.
- If you deploy **only** this `backend/` code onto `https://backend-1-wsky.onrender.com`, you **cannot** set `UPSTREAM_INSERT_URL` to that same `/insert` or the server will call itself in a loop. You need either a **second** service that only does insert, or merge your database insert logic into this repo.

## Security notes

- Do not commit `.env` or real API keys.
- The browser never sees `RESEND_API_KEY`; only this server sends mail.
- Inserts that bypass this service and call the upstream URL directly will **not** require OTP unless you change the upstream app itself.

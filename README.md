# Tracer Study (frontend + OTP API)

## Forms (Philippines address + email OTP)

- **Address:** Cascading region → province → city/municipality → barangay via [PSGC API](https://psgc.gitlab.io/api), plus optional street line. See [`address-psgc.js`](address-psgc.js) and [`pages/forms.html`](pages/forms.html).
- **Email OTP:** Submit opens a modal; the app calls your API for `request-otp` → `verify-otp` → `insert`. Configure the API URL in [`pages/forms.html`](pages/forms.html) as `window.TRACER_API_BASE`.

## Backend (Render / local)

The OTP gateway and secured insert proxy live in [`backend/`](backend/README.md).

1. Deploy the `backend` folder (e.g. Render: root `backend`, start `npm start`).
2. Set env vars: `JWT_SECRET`, `UPSTREAM_INSERT_URL`, `RESEND_API_KEY`, `RESEND_FROM`, `CORS_ORIGIN` (see [`backend/.env.example`](backend/.env.example)).
3. Point `window.TRACER_API_BASE` in `pages/forms.html` to your deployed API URL (not the old insert URL directly).

**CORS:** Set `CORS_ORIGIN` to your static site origin(s), comma-separated, or `*` for testing only.

**Email:** Without `RESEND_API_KEY`, OTP codes are printed in the server log (local dev only).

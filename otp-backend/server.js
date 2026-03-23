import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resend } from "resend";

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const OTP_SECRET = process.env.OTP_SECRET || JWT_SECRET;
const UPSTREAM_INSERT_URL =
    process.env.UPSTREAM_INSERT_URL ||
    "https://backend-1-wsky.onrender.com/insert";
const OTP_TTL_MS = 10 * 60 * 1000;
const JWT_TTL = "15m";
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
    cors({
        origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((s) => s.trim()),
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);
app.use(express.json());

/** @type {Map<string, { hashHex: string, expires: number }>} */
const otpStore = new Map();
/** @type {Map<string, { count: number, windowStart: number }>} */
const rateLimitMap = new Map();

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function hashOtp(email, code) {
    return crypto
        .createHmac("sha256", OTP_SECRET)
        .update(`${normalizeEmail(email)}:${code}`)
        .digest("hex");
}

function checkRateLimit(email) {
    const key = normalizeEmail(email);
    const now = Date.now();
    let r = rateLimitMap.get(key);
    if (!r || now - r.windowStart > RATE_WINDOW_MS) {
        rateLimitMap.set(key, { count: 1, windowStart: now });
        return true;
    }
    if (r.count >= RATE_MAX_REQUESTS) return false;
    r.count++;
    return true;
}

function timingSafeEqualHex(aHex, bHex) {
    try {
        const a = Buffer.from(aHex, "hex");
        const b = Buffer.from(bHex, "hex");
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

app.get("/", (_req, res) => {
    res.json({
        ok: true,
        service: "tracer-study-api",
        routes: ["/request-otp", "/verify-otp", "/insert"],
    });
});

app.post("/request-otp", async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email" });
    }
    if (!checkRateLimit(email)) {
        return res
            .status(429)
            .json({ error: "Too many requests. Try again in 15 minutes." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashHex = hashOtp(email, code);
    otpStore.set(email, { hashHex, expires: Date.now() + OTP_TTL_MS });

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
        const resend = new Resend(apiKey);
        const from = process.env.RESEND_FROM || "onboarding@resend.dev";
        try {
            await resend.emails.send({
                from,
                to: email,
                subject: "Your Tracer Study verification code",
                html:
                    "<p>Your verification code is: <strong>" +
                    code +
                    "</strong></p><p>This code expires in 10 minutes.</p>",
            });
        } catch (err) {
            console.error("Resend error:", err);
            otpStore.delete(email);
            return res.status(500).json({ error: "Failed to send email" });
        }
    } else {
        console.warn(
            "[dev] RESEND_API_KEY not set; OTP for",
            email,
            ":",
            code
        );
    }

    return res.json({ ok: true });
});

app.post("/verify-otp", (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").replace(/\D/g, "");
    if (!email || code.length !== 6) {
        return res.status(400).json({ error: "Invalid request" });
    }

    const rec = otpStore.get(email);
    if (!rec || rec.expires < Date.now()) {
        return res.status(400).json({ error: "Code expired or not found" });
    }

    const tryHash = hashOtp(email, code);
    if (!timingSafeEqualHex(rec.hashHex, tryHash)) {
        return res.status(400).json({ error: "Invalid code" });
    }

    otpStore.delete(email);
    const token = jwt.sign(
        { email, purpose: "insert" },
        JWT_SECRET,
        { expiresIn: JWT_TTL }
    );
    return res.json({ ok: true, emailVerificationToken: token });
});

app.post("/insert", async (req, res) => {
    const token = req.body?.emailVerificationToken;
    const bodyEmail = normalizeEmail(req.body?.Email || req.body?.email);
    if (!token) {
        return res.status(401).json({ error: "Email verification required" });
    }

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch {
        return res
            .status(401)
            .json({ error: "Invalid or expired verification" });
    }

    if (payload.purpose !== "insert" || normalizeEmail(payload.email) !== bodyEmail) {
        return res
            .status(401)
            .json({ error: "Verification does not match email" });
    }

    const forward = { ...req.body };
    delete forward.emailVerificationToken;

    try {
        const r = await fetch(UPSTREAM_INSERT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(forward),
        });
        const text = await r.text();
        let json;
        try {
            json = text ? JSON.parse(text) : {};
        } catch {
            json = { error: text || "Upstream error" };
        }
        return res.status(r.status).json(json);
    } catch (err) {
        console.error("Upstream insert error:", err);
        return res.status(502).json({ error: "Could not reach upstream API" });
    }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log("Tracer Study API listening on port", PORT);
    console.log("Upstream insert:", UPSTREAM_INSERT_URL);
    const selfUrl = process.env.RENDER_EXTERNAL_URL || "";
    if (
        selfUrl &&
        UPSTREAM_INSERT_URL.replace(/\/$/, "").startsWith(selfUrl.replace(/\/$/, ""))
    ) {
        console.warn(
            "[config] UPSTREAM_INSERT_URL points at this same host — proxy loop risk. Use a separate insert-only service URL, or merge DB insert into this app."
        );
    }
});

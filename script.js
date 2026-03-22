// API with OTP + insert proxy (see backend/). Override in forms.html via window.TRACER_API_BASE
function normalizeTracerApiBase(raw) {
    let u = String(raw || "").trim().replace(/\/+$/, "");
    // Common mistake: pasting .../insert — paths are added in code as /request-otp, /insert, etc.
    if (/\/insert$/i.test(u)) u = u.replace(/\/insert$/i, "");
    return u;
}
const API_BASE = (typeof window !== "undefined" && window.TRACER_API_BASE)
    ? normalizeTracerApiBase(window.TRACER_API_BASE)
    : "http://localhost:3000";

// After successful submit + OTP + insert (override if your index is not ../index.html)
const INDEX_URL =
    typeof window !== "undefined" && window.TRACER_INDEX_URL
        ? String(window.TRACER_INDEX_URL)
        : "../index.html";

const button = document.getElementById("submit-btn");
const nameInput = document.getElementById("fname");
const nameL = document.getElementById("lname");
const studentNumberInput = document.getElementById("studentNumber");
const dateInput = document.getElementById("calendarPicker");
const emailInput = document.getElementById("email");
const viberInput = document.getElementById("cpnum");
const categoryInput = document.getElementById("category");
const yearGraduatedInput = document.getElementById("yearGraduated");

/** @type {Record<string, unknown> | null} */
let pendingFormPayload = null;
let resendCooldownTimer = null;
let resendCooldownSec = 0;

const otpOverlay = document.getElementById("otp-modal-overlay");
const otpModal = document.getElementById("otp-modal");
const otpInput = document.getElementById("otp-input");
const otpVerifyBtn = document.getElementById("otp-verify-btn");
const otpResendBtn = document.getElementById("otp-resend-btn");
const otpCancelBtn = document.getElementById("otp-cancel-btn");
const otpStatus = document.getElementById("otp-modal-status");
const otpModalText = document.getElementById("otp-modal-text");

function maskEmail(addr) {
    const a = (addr || "").trim();
    const at = a.indexOf("@");
    if (at <= 0) return a;
    const user = a.slice(0, at);
    const domain = a.slice(at + 1);
    const u = user.length <= 2 ? user[0] + "*" : user[0] + "***" + user.slice(-1);
    return u + "@" + domain;
}

function setOtpModalVisible(show) {
    if (!otpOverlay || !otpModal) return;
    if (show) {
        otpOverlay.hidden = false;
        otpModal.hidden = false;
        otpOverlay.setAttribute("aria-hidden", "false");
        otpInput && otpInput.focus();
    } else {
        otpOverlay.hidden = true;
        otpModal.hidden = true;
        otpOverlay.setAttribute("aria-hidden", "true");
    }
}

function setOtpStatus(msg) {
    if (otpStatus) otpStatus.textContent = msg || "";
}

function updateResendButton() {
    if (!otpResendBtn) return;
    if (resendCooldownSec > 0) {
        otpResendBtn.disabled = true;
        otpResendBtn.textContent = "Resend code (" + resendCooldownSec + "s)";
    } else {
        otpResendBtn.disabled = false;
        otpResendBtn.textContent = "Resend code";
    }
}

function startResendCooldown(seconds) {
    resendCooldownSec = seconds;
    updateResendButton();
    if (resendCooldownTimer) clearInterval(resendCooldownTimer);
    resendCooldownTimer = setInterval(function () {
        resendCooldownSec--;
        updateResendButton();
        if (resendCooldownSec <= 0) {
            clearInterval(resendCooldownTimer);
            resendCooldownTimer = null;
            resendCooldownSec = 0;
            updateResendButton();
        }
    }, 1000);
}

async function postJson(path, body) {
    const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    let data;
    const text = await res.text();
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { error: text || "Invalid response" };
    }
    if (!res.ok) {
        const err = data.error || data.message || ("HTTP " + res.status);
        throw new Error(typeof err === "string" ? err : JSON.stringify(err));
    }
    return data;
}

async function sendRequestOtp(email) {
    return postJson("/request-otp", { email: email });
}

function closeOtpModal() {
    setOtpModalVisible(false);
    pendingFormPayload = null;
    if (otpInput) otpInput.value = "";
    setOtpStatus("");
    if (resendCooldownTimer) {
        clearInterval(resendCooldownTimer);
        resendCooldownTimer = null;
    }
    resendCooldownSec = 0;
    updateResendButton();
}

async function openOtpAndRequestCode(email) {
    if (otpModalText) {
        otpModalText.textContent = "We sent a 6-digit code to " + maskEmail(email) + ".";
    }
    setOtpStatus("Sending code…");
    if (otpVerifyBtn) otpVerifyBtn.disabled = true;
    try {
        await sendRequestOtp(email);
        setOtpStatus("Enter the code below.");
        startResendCooldown(60);
    } catch (e) {
        setOtpStatus(e.message || "Could not send code.");
    } finally {
        if (otpVerifyBtn) otpVerifyBtn.disabled = false;
    }
}

nameInput.addEventListener("keypress", function (e) {
    const char = e.key;
    if (/^[a-zA-Z -]$/.test(char)) return;
    if (char === "." && !this.value.includes(".")) return;
    e.preventDefault();
});

window.addEventListener("DOMContentLoaded", function () {
    const fnameContainer = document.getElementById("fnameContainer");
    const lnameContainer = document.getElementById("lnameContainer");
    const studentNumberContainer = document.getElementById("studentNumberContainer");
    const viberContainer = document.getElementById("viberContainer");
    const emailContainer = document.getElementById("emailContainer");
    const addressContainer = document.getElementById("addressContainer");

    nameInput.addEventListener("focus", function () { fnameContainer.classList.add("focusContainer"); });
    nameInput.addEventListener("blur", function () { fnameContainer.classList.remove("focusContainer"); });

    nameL.addEventListener("focus", function () { lnameContainer.classList.add("focusContainer"); });
    nameL.addEventListener("blur", function () { lnameContainer.classList.remove("focusContainer"); });

    studentNumberInput.addEventListener("focus", function () { studentNumberContainer.classList.add("focusContainer"); });
    studentNumberInput.addEventListener("blur", function () { studentNumberContainer.classList.remove("focusContainer"); });

    viberInput.addEventListener("focus", function () { viberContainer.classList.add("focusContainer"); });
    viberInput.addEventListener("blur", function () { viberContainer.classList.remove("focusContainer"); });

    emailInput.addEventListener("focus", function () { emailContainer.classList.add("focusContainer"); });
    emailInput.addEventListener("blur", function () { emailContainer.classList.remove("focusContainer"); });

    if (addressContainer) {
        addressContainer.addEventListener("focusin", function () { addressContainer.classList.add("focusContainer"); });
        addressContainer.addEventListener("focusout", function () { addressContainer.classList.remove("focusContainer"); });
    }

    try {
        const yearSelect = document.getElementById("yearGraduated");
        if (yearSelect) {
            yearSelect.innerHTML = "";
            const current = new Date().getFullYear();
            const range = 50;
            for (let y = current; y >= current - range; y--) {
                const opt = document.createElement("option");
                opt.value = String(y);
                opt.text = String(y);
                yearSelect.appendChild(opt);
            }
            yearSelect.value = String(current);
        }
    } catch (e) {
        console.error("Failed to populate yearGraduated", e);
    }
});

if (otpInput) {
    otpInput.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 6);
    });
}

if (otpCancelBtn) {
    otpCancelBtn.addEventListener("click", function () {
        closeOtpModal();
    });
}

if (otpResendBtn) {
    otpResendBtn.addEventListener("click", async function () {
        if (!pendingFormPayload || resendCooldownSec > 0) return;
        const email = String(pendingFormPayload.Email || "").trim();
        setOtpStatus("Sending code…");
        try {
            await sendRequestOtp(email);
            setOtpStatus("New code sent.");
            startResendCooldown(60);
        } catch (e) {
            setOtpStatus(e.message || "Could not resend.");
        }
    });
}

if (otpVerifyBtn) {
    otpVerifyBtn.addEventListener("click", async function () {
        if (!pendingFormPayload) return;
        const email = String(pendingFormPayload.Email || "").trim();
        const code = (otpInput && otpInput.value) ? otpInput.value.replace(/\D/g, "") : "";
        if (code.length !== 6) {
            setOtpStatus("Enter the 6-digit code.");
            return;
        }
        setOtpStatus("Verifying…");
        otpVerifyBtn.disabled = true;
        try {
            const out = await postJson("/verify-otp", { email: email, code: code });
            const token = out.emailVerificationToken || out.token;
            if (!token) throw new Error("No verification token returned");

            const insertBody = Object.assign({}, pendingFormPayload, { emailVerificationToken: token });
            const insertRes = await fetch(API_BASE + "/insert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(insertBody),
            });
            const insertText = await insertRes.text();
            let insertData;
            try {
                insertData = insertText ? JSON.parse(insertText) : {};
            } catch {
                insertData = { error: insertText };
            }
            if (!insertRes.ok) {
                const err = insertData.error || insertData.message || ("HTTP " + insertRes.status);
                throw new Error(typeof err === "string" ? err : JSON.stringify(err));
            }
            if (insertData.error) {
                const msg = typeof insertData.error === "string"
                    ? insertData.error.split("for")[0].trim()
                    : insertData.error;
                alert(msg);
                return;
            }
            closeOtpModal();
            window.location.replace(INDEX_URL);
        } catch (e) {
            setOtpStatus(e.message || "Verification failed.");
        } finally {
            otpVerifyBtn.disabled = false;
        }
    });
}

viberInput.addEventListener("keypress", function (e) {
    const char = e.key;
    if (/^[0-9]$/.test(char)) return;
    e.preventDefault();
});

studentNumberInput.addEventListener("keypress", function (e) {
    const char = e.key;
    if (/^[0-9]$/.test(char)) return;
    e.preventDefault();
});

button.addEventListener("click", function () {
    if (!nameL.value || nameL.value.trim() === "") {
        alert("Please fill in Last Name");
        return;
    }

    const email = (emailInput.value || "").trim();
    if (!email) {
        alert("Please fill in Email");
        return;
    }

    function isProbablyRealEmail(addr) {
        const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!re.test(addr)) return false;
        const domain = addr.split("@")[1].toLowerCase();
        if (/^\d+\.\d+\.\d+\.\d+$/.test(domain) || domain.startsWith("localhost")) return false;
        const parts = domain.split(".");
        const tld = parts[parts.length - 1];
        if (!/^[A-Za-z]{2,63}$/.test(tld)) return false;
        const disposable = new Set([
            "mailinator.com", "10minutemail.com", "guerrillamail.com", "yopmail.com",
            "tempmail.com", "trashmail.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
            "mailnesia.com",
        ]);
        for (const d of disposable) {
            if (domain === d || domain.endsWith("." + d)) return false;
        }
        return true;
    }

    if (!isProbablyRealEmail(email)) {
        alert("Please enter a valid, non-disposable email address");
        return;
    }

    const viber = (viberInput.value || "").trim();
    if (!/^\d{11}$/.test(viber)) {
        alert("Viber number must be exactly 11 digits");
        return;
    }

    if (typeof window.isPhilippinesAddressComplete === "function" && !window.isPhilippinesAddressComplete()) {
        alert("Please complete your address: region, province, city/municipality, and barangay.");
        return;
    }

    const addressStr = typeof window.buildPhilippinesAddressString === "function"
        ? window.buildPhilippinesAddressString()
        : "";

    const data = {
        Name: `${nameInput.value} ${nameL.value}`,
        firstName: nameInput.value,
        lastName: nameL.value,
        fName: nameInput.value,
        LName: nameL.value,
        StudentNumber: studentNumberInput ? studentNumberInput.value : "",
        Birthday: dateInput.value,
        Address: addressStr,
        Email: email,
        Viber: viberInput.value,
        Course: categoryInput.value,
        Year_Graduated: yearGraduatedInput.value,
    };

    let nullFound = false;
    for (const key in data) {
        if (key === "StudentNumber" && (data[key] === null || data[key] === "")) {
            continue;
        }
        if (data[key] === null || data[key] === "") {
            alert("Please fill in " + key);
            nullFound = true;
            break;
        }
    }

    if (nullFound) return;

    pendingFormPayload = data;
    if (otpInput) otpInput.value = "";
    setOtpModalVisible(true);
    openOtpAndRequestCode(email);
});

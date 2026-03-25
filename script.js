// Firebase-based authentication and data submission
// No more custom API calls - everything handled by Firebase

// After successful submit + auth + firestore write
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

// Remove OTP modal elements - we'll use a simple loading message instead
const loadingOverlay = document.createElement("div");
loadingOverlay.id = "loading-overlay";
loadingOverlay.innerHTML = `
    <div id="loading-modal">
        <p id="loading-text">Sending verification email...</p>
    </div>
`;
loadingOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: none; justify-content: center;
    align-items: center; z-index: 1000;
`;
document.body.appendChild(loadingOverlay);

const loadingText = document.getElementById("loading-text");

function showLoading(message) {
    loadingText.textContent = message;
    loadingOverlay.style.display = "flex";
}

function hideLoading() {
    loadingOverlay.style.display = "none";
}

function maskEmail(addr) {
    const a = (addr || "").trim();
    const at = a.indexOf("@");
    if (at <= 0) return a;
    const user = a.slice(0, at);
    const domain = a.slice(at + 1);
    const u = user.length <= 2 ? user[0] + "*" : user[0] + "***" + user.slice(-1);
    return u + "@" + domain;
}

// Firebase authentication functions
async function sendVerificationEmail(email) {
    const actionCodeSettings = {
        url: window.location.href, // Redirect back to this page
        handleCodeInApp: true,
    };

    try {
        await window.sendSignInLinkToEmail(null, email, actionCodeSettings);
        // Save email to localStorage for sign-in completion
        window.localStorage.setItem('emailForSignIn', email);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email: ' + error.message);
    }
}

async function submitToFirestore(formData) {
    try {
        const collectionRef = window.firebaseCollection(null, 'tracer-study-submissions');
        const docRef = await window.firebaseAddDoc(collectionRef, {
            ...formData,
            submittedAt: new Date(),
            verified: true
        });
        console.log('Document written with ID: ', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding document: ', error);
        throw new Error('Failed to save data: ' + error.message);
    }
}

// Check if returning from email link
async function handleEmailLinkSignIn() {
    if (window.isSignInWithEmailLink(null, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }

        try {
            // restore pending payload from localStorage when returning via email link
            if (!pendingFormPayload) {
                const saved = window.localStorage.getItem('pendingFormPayload');
                if (saved) {
                    try {
                        pendingFormPayload = JSON.parse(saved);
                    } catch (err) {
                        console.warn('Could not parse pending form payload', err);
                    }
                }
            }

            showLoading('Verifying email and saving data...');
            const result = await window.signInWithEmailLink(null, email, window.location.href);
            console.log('Successfully signed in:', result.user);

            // Clear email from storage
            window.localStorage.removeItem('emailForSignIn');

            // Submit the pending form data
            if (pendingFormPayload) {
                await submitToFirestore(pendingFormPayload);
                window.localStorage.removeItem('pendingFormPayload');
                hideLoading();
                alert('Form submitted successfully!');
                window.location.replace(INDEX_URL);
            } else {
                hideLoading();
                alert('Verification successful, but no form data found. Please try submitting again.');
            }
        } catch (error) {
            hideLoading();
            console.error('Error signing in with email link:', error);
            alert('Verification failed: ' + error.message);
        }
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

    // Check if user is returning from email verification
    handleEmailLinkSignIn();
});

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

button.addEventListener("click", async function () {
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

    // Store form data for later submission after email verification
    pendingFormPayload = data;
    window.localStorage.setItem('pendingFormPayload', JSON.stringify(data));

    try {
        showLoading(`Sending verification email to ${maskEmail(email)}...`);
        await sendVerificationEmail(email);
        hideLoading();
        alert(`Verification email sent to ${maskEmail(email)}. Please check your email and click the link to complete submission.`);
    } catch (error) {
        hideLoading();
        alert('Failed to send verification email: ' + error.message);
    }
});

const button = document.getElementById("submit-btn");
const nameInput = document.getElementById("fname");
const nameL = document.getElementById("lname");
const studentNumberInput = document.getElementById("studentNumber");
const addressInput = document.getElementById("address");
const dateInput = document.getElementById("calendarPicker");
const emailInput = document.getElementById("email");
const viberInput = document.getElementById("cpnum");
const categoryInput = document.getElementById("category");
const yearGraduatedInput = document.getElementById("yearGraduated");

nameInput.addEventListener("keypress", function (e) {
    const char = e.key;

    // Allow letters and space
    if (/^[a-zA-Z -]$/.test(char)) return;

    // Allow one period only
    if (char === "." && !this.value.includes(".")) return;

    // Block everything else
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

    addressInput.addEventListener("focus", function () { addressContainer.classList.add("focusContainer"); });
    addressInput.addEventListener("blur", function () { addressContainer.classList.remove("focusContainer"); });
    // populate `yearGraduated` with a wide range of years (current down to -50)
    try {
        const yearSelect = document.getElementById('yearGraduated');
        if (yearSelect) {
            yearSelect.innerHTML = ''; // clear static options
            const current = new Date().getFullYear();
            const range = 50; // number of years back
            for (let y = current; y >= current - range; y--) {
                const opt = document.createElement('option');
                opt.value = String(y);
                opt.text = String(y);
                yearSelect.appendChild(opt);
            }
            yearSelect.value = String(current);
        }
    } catch (e) {
        console.error('Failed to populate yearGraduated', e);
    }
});

viberInput.addEventListener("keypress", function (e) {
    const char = e.key;

    // Allow numbers and plus sign
    if (/^[0-9+]$/.test(char)) return;

    // Block everything else
    e.preventDefault();
});

studentNumberInput.addEventListener("keypress", function (e) {
    const char = e.key;
    if (/^[0-9]$/.test(char)) return;
    e.preventDefault();
});

button.addEventListener("click", function () {

    // enforce last name is provided (prevent submit if empty)
    if (!nameL.value || nameL.value.trim() === "") {
        alert("Please fill in Last Name");
        return;
    }

    // enforce email is provided and valid
    const email = (emailInput.value || "").trim();
    if (!email) {
        alert("Please fill in Email");
        return;
    }

    // stronger client-side validation: regex + domain/TLD checks + disposable-domain blacklist
    function isProbablyRealEmail(addr) {
        const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!re.test(addr)) return false;
        const domain = addr.split('@')[1].toLowerCase();
        // reject literal IPs and localhost
        if (/^\d+\.\d+\.\d+\.\d+$/.test(domain) || domain.startsWith('localhost')) return false;
        // basic TLD check (already enforced by regex), extra safety: ensure last label >=2 letters
        const parts = domain.split('.');
        const tld = parts[parts.length - 1];
        if (!/^[A-Za-z]{2,63}$/.test(tld)) return false;
        // small disposable-email provider blacklist (client-side best-effort)
        const disposable = new Set([
            'mailinator.com','10minutemail.com','guerrillamail.com','yopmail.com',
            'tempmail.com','trashmail.com','dispostable.com','maildrop.cc','fakeinbox.com',
            'mailnesia.com'
        ]);
        for (const d of disposable) {
            if (domain === d || domain.endsWith('.' + d)) return false;
        }
        return true;
    }

    if (!isProbablyRealEmail(email)) {
        alert('Please enter a valid, non-disposable email address');
        return;
    }

    const data = {
        // include `Name` for back-end columns that expect a single Name field
        Name: `${nameInput.value} ${nameL.value}`,
        fName: nameInput.value,
        LName: nameInput.value,
        StudentNumber: studentNumberInput ? studentNumberInput.value : "",
        Birthday: dateInput.value,
        Address: addressInput.value,
        Email: email,
        Viber: viberInput.value,
        Course: categoryInput.value,
        Year_Graduated: yearGraduatedInput.value,
    }
    console.log("data:", data);

    let nullFound = false;
    for (const key in data) {
        // Allow StudentNumber to be left blank (optional field)
        if (key === "StudentNumber" && (data[key] === null || data[key] === "")) {
            continue;
        }
        if (data[key] === null || data[key] === "") {
            // document.querySelector(`.${key}`).textContent = "Please fill in this field";
            alert(`Please fill in ${key}`);
            nullFound = true;
            break;
        }
    }

    if (!nullFound) {
        fetch("https://backend-1-wsky.onrender.com/insert", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }).then(res => res.json()).then(data => {
            if (data.error) {
                alert(data.error.split("for")[0].trim());
            } else {
                alert("Successfully inserted!");
                window.location.href = "../index.html";
            }
        })
    }
})

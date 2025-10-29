const button = document.getElementById("submit-btn");
const nameInput = document.getElementById("fname");
const addressInput = document.getElementById("address");
const dateInput = document.getElementById("calendarPicker");
const emailInput = document.getElementById("email");
const viberInput = document.getElementById("cpnum");
const categoryInput = document.getElementById("category");
const yearGraduatedInput = document.getElementById("yearGraduated");

nameInput.addEventListener("keypress", function (e) {
    const char = e.key;

    // Allow letters and space
    if (/^[a-zA-Z ]$/.test(char)) return;

    // Allow one period only
    if (char === "." && !this.value.includes(".")) return;

    // Block everything else
    e.preventDefault();
});

window.addEventListener("DOMContentLoaded", function () {

    const fnameContainer = document.getElementById("fnameContainer");
    const viberContainer = document.getElementById("viberContainer");
    const emailContainer = document.getElementById("emailContainer");
    const addressContainer = document.getElementById("addressContainer");

    nameInput.addEventListener("focus", function () { fnameContainer.classList.add("focusContainer"); });
    nameInput.addEventListener("blur", function () { fnameContainer.classList.remove("focusContainer"); });

    viberInput.addEventListener("focus", function () { viberContainer.classList.add("focusContainer"); });
    viberInput.addEventListener("blur", function () { viberContainer.classList.remove("focusContainer"); });

    emailInput.addEventListener("focus", function () { emailContainer.classList.add("focusContainer"); });
    emailInput.addEventListener("blur", function () { emailContainer.classList.remove("focusContainer"); });

    addressInput.addEventListener("focus", function () { addressContainer.classList.add("focusContainer"); });
    addressInput.addEventListener("blur", function () { addressContainer.classList.remove("focusContainer"); });

});

viberInput.addEventListener("keypress", function (e) {
    const char = e.key;

    // Allow numbers and plus sign
    if (/^[0-9+]$/.test(char)) return;

    // Block everything else
    e.preventDefault();
});

button.addEventListener("click", function () {

    const data = {
        Name: nameInput.value,
        Birthday: dateInput.value,
        Address: addressInput.value,
        Email: emailInput.value,
        Viber: viberInput.value,
        Course: categoryInput.value,
        Year_Graduated: yearGraduatedInput.value,
    }
    console.log("data:", data);

    let nullFound = false;
    for (const key in data) {
        if (data[key] === null || data[key] === "") {
            // document.querySelector(`.${key}`).textContent = "Please fill in this field";
            alert(`Please fill in ${key}`);
            nullFound = true;
            break;
        }
    }

    if (!nullFound) {
        fetch("https://backend-t47d.onrender.com/insert", {
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

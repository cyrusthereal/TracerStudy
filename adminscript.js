// Single, cleaned-up admin script with department-aware filtering

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Map course codes to departments (no "Others")
const COURSE_DEPT_MAP = {
    // College of Education
    BEED: "College of Education",
    BSED: "College of Education",
    BSNED: "College of Education",

    // College of Nursing
    BSN: "College of Nursing",

    // College of Business & Accountancy
    BSA: "College of Business & Accountancy",
    BSAIS: "College of Business & Accountancy",
    BSBA_MM: "College of Business & Accountancy",
    "BSBA-FM": "College of Business & Accountancy",
    "BSBA-M": "College of Business & Accountancy",

    // College of Hospitality, Tourism & Culinary Management
    BSHM: "College of Hospitality, Tourism & Culinary Management",
    BSTOM: "College of Hospitality, Tourism & Culinary Management",
    BSCM: "College of Hospitality, Tourism & Culinary Management",

    // College of Engineering & Information Technology
    BSIE: "College of Engineering & Information Technology",
    BSCPE: "College of Engineering & Information Technology",
    BSCS: "College of Engineering & Information Technology",
    BSIT: "College of Engineering & Information Technology",
    BSECE: "College of Engineering & Information Technology",

    // Special Programs
    ETEEAP: "Special Programs",
    CEP: "Special Programs",
    TCP: "Special Programs",
};

let allRows = [];

function init() {
    setupFilterControls();
    getAllRecords();
}

function renderRows(rows) {
    const tbody = document.getElementById("records-tbody");
    tbody.innerHTML = "";
    rows.forEach(row => {
        const tr = document.createElement("tr");
        const fullName = row.fName || row.fname || row.Name || row.name || "";
        let first = "";
        let last = "";
        if (fullName) {
            const parts = fullName.trim().split(/\s+/);
            first = parts[0] || "";
            last = parts.slice(1).join(" ") || "";
        }
        first = row.fName ?? row.fname ?? first;
        last = row.LName ?? row.lname ?? last;

        tr.innerHTML = `
            <td>${first}</td>
            <td>${last}</td>
            <td>${row.StudentNumber ?? row.studentNumber ?? ""}</td>
            <td>${row.Address ?? row.address ?? ""}</td>
            <td>${row.Birthday ?? row.birthday ?? ""}</td>
            <td>${row.Email ?? row.email ?? ""}</td>
            <td>${row.Viber ?? row.viber ?? ""}</td>
            <td>${row.Course ?? row.course ?? ""}</td>
            <td>${row.Year_Graduated ?? row.year_graduated ?? row.yearGraduated ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getAllRecords() {
    console.log("Records populated on page load");
    fetch("https://backend-t47d.onrender.com/select", { method: "GET" })
        .then(res => {
            if (!res.ok) throw new Error("Request failed: " + res.status);
            return res.json();
        })
        .then(data => {
            console.log("data:", data);
            if (data && data.error) {
                alert(data.error);
                return;
            }
            const rows = Array.isArray(data) ? data : [];
            allRows = rows;
            renderRows(allRows);
            populateFilterOptions(allRows);
        })
        .catch(err => {
            console.error("getAll error:", err);
            alert("Failed to fetch records: " + err.message);
        });
}

function setupFilterControls() {
    const searchInput = document.getElementById('searchinput');
    const deptSelect = document.getElementById('search-dept');
    const yearSelect = document.getElementById('search-year');
    const filterBtn = document.getElementById('filter-btn');
    const clearBtn = document.getElementById('clear-filter-btn');

    if (!searchInput) return;

    searchInput.addEventListener('change', function () {
        const v = this.value;
        if (deptSelect) deptSelect.style.display = 'none';
        if (yearSelect) yearSelect.style.display = 'none';
        if (filterBtn) filterBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';

        if (v === 'dept') {
            if (deptSelect) deptSelect.style.display = '';
            if (filterBtn) filterBtn.style.display = '';
            if (clearBtn) clearBtn.style.display = '';
        } else if (v === 'yrgrad') {
            if (yearSelect) yearSelect.style.display = '';
            if (filterBtn) filterBtn.style.display = '';
            if (clearBtn) clearBtn.style.display = '';
        }
    });

    filterBtn && filterBtn.addEventListener('click', function () {
        applyFilter();
    });

    clearBtn && clearBtn.addEventListener('click', function () {
        document.getElementById('searchinput').value = '';
        if (deptSelect) deptSelect.style.display = 'none';
        if (yearSelect) yearSelect.style.display = 'none';
        if (filterBtn) filterBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
        renderRows(allRows);
    });
}

function populateFilterOptions(rows) {
    const deptSelect = document.getElementById('search-dept');
    const yearSelect = document.getElementById('search-year');
    if (!rows) return;

    const depts = new Set();
    const years = new Set();

    rows.forEach(r => {
        const courseCode = (r.Course || r.course || "").toString();
        const dept = COURSE_DEPT_MAP[courseCode];
        if (dept) {
            depts.add(dept);
        }
        const yearVal = r.Year_Graduated || r.year_graduated || r.yearGraduated;
        if (yearVal) {
            years.add(yearVal.toString());
        }
    });

    // populate department select (no "Others")
    if (deptSelect) {
        deptSelect.innerHTML = '';
        const empty = document.createElement('option');
        empty.value = '';
        empty.text = 'Select department';
        deptSelect.appendChild(empty);
        Array.from(depts).sort().forEach(d => {
            const o = document.createElement('option');
            o.value = d;
            o.text = d;
            deptSelect.appendChild(o);
        });
    }

    // populate year select
    if (yearSelect) {
        yearSelect.innerHTML = '';
        const empty = document.createElement('option');
        empty.value = '';
        empty.text = 'Select year';
        yearSelect.appendChild(empty);
        Array.from(years)
            .sort((a, b) => b - a)
            .forEach(y => {
                const o = document.createElement('option');
                o.value = y;
                o.text = y;
                yearSelect.appendChild(o);
            });
    }
}

function applyFilter() {
    const type = document.getElementById('searchinput').value;
    if (!type) return;

    if (type === 'dept') {
        const deptSelect = document.getElementById('search-dept');
        if (!deptSelect) return;
        const dept = deptSelect.value;
        if (!dept) return alert('Please select a department');

        const filtered = allRows.filter(r => {
            const courseCode = (r.Course || r.course || "").toString();
            const rowDept = COURSE_DEPT_MAP[courseCode];
            return rowDept === dept;
        });
        renderRows(filtered);
    } else if (type === 'yrgrad') {
        const year = document.getElementById('search-year').value;
        if (!year) return alert('Please select a year');
        const filtered = allRows.filter(r => ((r.Year_Graduated || r.year_graduated || r.yearGraduated) || '').toString() === year);
        renderRows(filtered);
    }
}

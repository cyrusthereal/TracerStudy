if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

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
    const courseSelect = document.getElementById('search-course');
    const yearSelect = document.getElementById('search-year');
    const filterBtn = document.getElementById('filter-btn');
    const clearBtn = document.getElementById('clear-filter-btn');

    searchInput && searchInput.addEventListener('change', function () {
        const v = this.value;
        courseSelect.style.display = 'none';
        yearSelect.style.display = 'none';
        filterBtn.style.display = 'none';
        clearBtn.style.display = 'none';
        if (v === 'course') {
            courseSelect.style.display = '';
            filterBtn.style.display = '';
            clearBtn.style.display = '';
        } else if (v === 'yrgrad') {
            yearSelect.style.display = '';
            filterBtn.style.display = '';
            clearBtn.style.display = '';
        }
    });

    filterBtn && filterBtn.addEventListener('click', function () {
        applyFilter();
    });

    clearBtn && clearBtn.addEventListener('click', function () {
        document.getElementById('searchinput').value = '';
        courseSelect.style.display = 'none';
        yearSelect.style.display = 'none';
        filterBtn.style.display = 'none';
        clearBtn.style.display = 'none';
        renderRows(allRows);
    });
}

function populateFilterOptions(rows) {
    const courseSelect = document.getElementById('search-course');
    const yearSelect = document.getElementById('search-year');
    if (!rows) return;
    const courses = new Set();
    const years = new Set();
    rows.forEach(r => {
        if (r.Course || r.course) courses.add((r.Course || r.course).toString());
        if (r.Year_Graduated || r.year_graduated || r.yearGraduated) years.add((r.Year_Graduated || r.year_graduated || r.yearGraduated).toString());
    });
    // populate course select
    if (courseSelect) {
        courseSelect.innerHTML = '';
        const empty = document.createElement('option');
        empty.value = '';
        empty.text = 'Select course';
        courseSelect.appendChild(empty);
        Array.from(courses).sort().forEach(c => {
            const o = document.createElement('option'); o.value = c; o.text = c; courseSelect.appendChild(o);
        });
    }
    if (yearSelect) {
        yearSelect.innerHTML = '';
        const empty = document.createElement('option');
        empty.value = '';
        empty.text = 'Select year';
        yearSelect.appendChild(empty);
        Array.from(years).sort((a, b) => b - a).forEach(y => {
            const o = document.createElement('option'); o.value = y; o.text = y; yearSelect.appendChild(o);
        });
    }
}

function applyFilter() {
    const type = document.getElementById('searchinput').value;
    if (!type) return;
    if (type === 'course') {
        const course = document.getElementById('search-course').value;
        if (!course) return alert('Please select a course');
        const filtered = allRows.filter(r => (r.Course || r.course || '').toString() === course);
        renderRows(filtered);
    } else if (type === 'yrgrad') {
        const year = document.getElementById('search-year').value;
        if (!year) return alert('Please select a year');
        const filtered = allRows.filter(r => ((r.Year_Graduated || r.year_graduated || r.yearGraduated) || '').toString() === year);
        renderRows(filtered);
    }
}
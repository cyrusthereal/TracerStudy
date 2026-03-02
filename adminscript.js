// filtering-enabled admin script
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

let allRows = [];

// map each course code to a department name
const courseToDept = {
    BEED: 'College of Education',
    BSED: 'College of Education',
    BSNED: 'College of Education',
    BSN: 'College of Nursing',
    BSA: 'College of Business & Accountancy',
    BSAIS: 'College of Business & Accountancy',
    MM: 'College of Business & Accountancy',
    FM: 'College of Business & Accountancy',
    M: 'College of Business & Accountancy',
    BSHM: 'College of Hospitality, Tourism & Culinary Management',
    BSTOM: 'College of Hospitality, Tourism & Culinary Management',
    BSCM: 'College of Hospitality, Tourism & Culinary Management',
    BSIE: 'College of Engineering & Information Technology',
    BSCPE: 'College of Engineering & Information Technology',
    BSCS: 'College of Engineering & Information Technology',
    BSIT: 'College of Engineering & Information Technology',
    BSECE: 'College of Engineering & Information Technology',
    ETEEAP: 'Special Programs',
    CEP: 'Special Programs',
    TCP: 'Special Programs'
};

function init() {
    setupFilterControls();
    getAllRecords();
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
        if (v === 'yrgrad' && yearSelect) {
            yearSelect.style.display = '';
            filterBtn.style.display = '';
            clearBtn.style.display = '';
        } else if (v === 'dept' && deptSelect) {
            deptSelect.style.display = '';
            filterBtn.style.display = '';
            clearBtn.style.display = '';
        }
    });

    filterBtn && filterBtn.addEventListener('click', applyFilter);
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
    // build map: department name -> set of courses
    const deptMap = {};
    const years = new Set();
    rows.forEach(r => {
        const course = (r.Course || r.course || '').toString();
        const dept = courseToDept[course] || 'Other';
        if (!deptMap[dept]) deptMap[dept] = new Set();
        deptMap[dept].add(course);
        if (r.Year_Graduated || r.year_graduated || r.yearGraduated) years.add((r.Year_Graduated || r.year_graduated || r.yearGraduated).toString());
    });
    if (deptSelect) {
        deptSelect.innerHTML = '';
        const empty = document.createElement('option'); empty.value = ''; empty.text = 'Select course'; deptSelect.appendChild(empty);
        // create optgroups by department
        Object.keys(deptMap).sort().forEach(dept => {
            const group = document.createElement('optgroup');
            group.label = dept;
            Array.from(deptMap[dept]).sort().forEach(course => {
                const o = document.createElement('option');
                o.value = course;
                o.text = course;
                group.appendChild(o);
            });
            deptSelect.appendChild(group);
        });
    }
    if (yearSelect) {
        yearSelect.innerHTML = '';
        const empty = document.createElement('option'); empty.value = ''; empty.text = 'Select year'; yearSelect.appendChild(empty);
        Array.from(years).sort((a,b)=>b-a).forEach(y => { const o=document.createElement('option'); o.value=y;o.text=y;yearSelect.appendChild(o);});
    }
}

function applyFilter() {
    const type = document.getElementById('searchinput').value;
    if (!type) return;
    if (type === 'dept') {
        const course = document.getElementById('search-dept').value;
        if (!course) return alert('Please select a course');
        const filtered = allRows.filter(r => ((r.Course || r.course || '').toString() === course));
        renderRows(filtered);
    } else if (type === 'yrgrad') {
        const year = document.getElementById('search-year').value;
        if (!year) return alert('Please select a year');
        const filtered = allRows.filter(r => ((r.Year_Graduated || r.year_graduated || r.yearGraduated) || '').toString() === year);
        renderRows(filtered);
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", getAllRecords);
} else {
    getAllRecords();
}

function getAllRecords() {
    console.log("Records populated on page load");
        fetch("https://backend-t47d.onrender.com/select", {
            method: "GET",
        })
        .then(res => {
            if (!res.ok) throw new Error("Request failed: " + res.status);
            return res.json();
        })
        .then(data => {
            console.log("data:", data);
            if(data && data.error) {
                alert(data.error);
                return;
            }
            
            const rows = Array.isArray(data) ? data : [];
            const tbody = document.getElementById("records-tbody");
            tbody.innerHTML = "";
            rows.forEach(row => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${row.Name ?? ""}</td>
                    <td>${row.Address ?? ""}</td>
                    <td>${row.Birthday ?? ""}</td>
                    <td>${row.Email ?? ""}</td>
                    <td>${row.Viber ?? ""}</td>
                    <td>${row.Course ?? ""}</td>
                    <td>${row.Year_Graduated ?? ""}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("getAll error:", err);
            alert("Failed to fetch records: " + err.message);
        });
}
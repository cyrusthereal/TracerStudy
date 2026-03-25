/**
 * Philippines address cascading dropdowns (PSGC API: https://psgc.gitlab.io/api)
 */
(function () {
    const PSGC_BASE = "https://psgc.gitlab.io/api";

    function byId(id) {
        return document.getElementById(id);
    }

    function setLoading(select, loading) {
        select.disabled = loading || select.options.length <= 1;
        select.dataset.loading = loading ? "1" : "";
    }

    function resetSelect(select, placeholder) {
        select.innerHTML = "";
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = placeholder;
        select.appendChild(opt);
    }

    async function fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return res.json();
    }

    function populateSelect(select, items, valueKey, labelKey, placeholder) {
        resetSelect(select, placeholder);
        if (!Array.isArray(items)) return;
        items.forEach(function (item) {
            const o = document.createElement("option");
            o.value = item[valueKey];
            o.textContent = item[labelKey] || item.name;
            select.appendChild(o);
        });
        select.disabled = select.options.length <= 1;
    }

    window.buildPhilippinesAddressString = function () {
        const region = byId("addr-region");
        const province = byId("addr-province");
        const city = byId("addr-city");
        const barangay = byId("addr-barangay");
        const street = byId("addr-street");
        if (!region || !province || !city || !barangay) return "";

        const rName = region.options[region.selectedIndex]
            ? region.options[region.selectedIndex].textContent
            : "";
        const pName = province.options[province.selectedIndex]
            ? province.options[province.selectedIndex].textContent
            : "";
        const cName = city.options[city.selectedIndex]
            ? city.options[city.selectedIndex].textContent
            : "";
        const bName = barangay.options[barangay.selectedIndex]
            ? barangay.options[barangay.selectedIndex].textContent
            : "";
        const s = (street && street.value) ? street.value.trim() : "";

        const ncr = province && province.dataset.ncr === "1";
        const pNameSkip = ncr ? "" : pName;
        const parts = [s, bName, cName, pNameSkip, rName].filter(function (x) {
            return x && x !== "Select region" && x !== "Select province" &&
                x !== "Select city / municipality" && x !== "Select barangay" &&
                x !== "NCR — pick city/municipality next";
        });
        return parts.join(", ");
    };

    window.isPhilippinesAddressComplete = function () {
        const region = byId("addr-region");
        const province = byId("addr-province");
        const city = byId("addr-city");
        const barangay = byId("addr-barangay");
        if (!region || !province || !city || !barangay) return false;
        const ncr = province.dataset.ncr === "1";
        if (ncr) {
            return !!(region.value && city.value && barangay.value);
        }
        return !!(region.value && province.value && city.value && barangay.value);
    };

    function init() {
        const regionSel = byId("addr-region");
        const provSel = byId("addr-province");
        const citySel = byId("addr-city");
        const brgySel = byId("addr-barangay");
        const errEl = byId("addr-error");

        if (!regionSel || !provSel || !citySel || !brgySel) return;

        function showAddrError(msg) {
            if (errEl) errEl.textContent = msg || "";
        }

        regionSel.addEventListener("change", async function () {
            delete provSel.dataset.ncr;
            resetSelect(provSel, "Select province");
            resetSelect(citySel, "Select city / municipality");
            resetSelect(brgySel, "Select barangay");
            provSel.disabled = true;
            citySel.disabled = true;
            brgySel.disabled = true;
            showAddrError("");
            const code = regionSel.value;
            if (!code) return;
            try {
                setLoading(provSel, true);
                const provinces = await fetchJson(PSGC_BASE + "/regions/" + code + "/provinces/");

                // NCR and some areas have no provinces in PSGC; cities are under the region.
                if (!provinces.length) {
                    provSel.dataset.ncr = "1";
                    resetSelect(provSel, "Select province");
                    provSel.innerHTML = "";
                    const ph = document.createElement("option");
                    ph.value = "";
                    ph.textContent = "NCR — pick city/municipality next";
                    provSel.appendChild(ph);
                    provSel.disabled = true;

                    setLoading(citySel, true);
                    const cities = await fetchJson(
                        PSGC_BASE + "/regions/" + code + "/cities-municipalities/"
                    );
                    populateSelect(
                        citySel,
                        cities,
                        "code",
                        "name",
                        "Select city / municipality"
                    );
                    setLoading(citySel, false);
                    setLoading(provSel, false);
                    return;
                }

                populateSelect(provSel, provinces, "code", "name", "Select province");
            } catch (e) {
                console.error(e);
                showAddrError("Could not load provinces. Try again.");
            } finally {
                setLoading(provSel, false);
            }
        });

        provSel.addEventListener("change", async function () {
            if (provSel.dataset.ncr === "1") return;
            resetSelect(citySel, "Select city / municipality");
            resetSelect(brgySel, "Select barangay");
            citySel.disabled = true;
            brgySel.disabled = true;
            showAddrError("");
            const code = provSel.value;
            if (!code) return;
            try {
                setLoading(citySel, true);
                const cities = await fetchJson(PSGC_BASE + "/provinces/" + code + "/cities-municipalities/");
                populateSelect(citySel, cities, "code", "name", "Select city / municipality");
            } catch (e) {
                console.error(e);
                showAddrError("Could not load cities/municipalities. Try again.");
            } finally {
                setLoading(citySel, false);
            }
        });

        citySel.addEventListener("change", async function () {
            resetSelect(brgySel, "Select barangay");
            brgySel.disabled = true;
            showAddrError("");
            const code = citySel.value;
            if (!code) return;
            try {
                setLoading(brgySel, true);
                const brgys = await fetchJson(PSGC_BASE + "/cities-municipalities/" + code + "/barangays/");
                populateSelect(brgySel, brgys, "code", "name", "Select barangay");
            } catch (e) {
                console.error(e);
                showAddrError("Could not load barangays. Try again.");
            } finally {
                setLoading(brgySel, false);
            }
        });

        (async function loadRegions() {
            try {
                regionSel.disabled = true;
                const regions = await fetchJson(PSGC_BASE + "/regions/");
                regions.sort(function (a, b) {
                    return (a.regionName || a.name).localeCompare(b.regionName || b.name);
                });
                populateSelect(regionSel, regions, "code", "name", "Select region");
                regionSel.disabled = false;
            } catch (e) {
                console.error(e);
                showAddrError("Could not load regions. Check your connection.");
            }
        })();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

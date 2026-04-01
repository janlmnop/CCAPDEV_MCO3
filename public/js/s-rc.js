/* ============================================================
   rc.js  —  Student version
   Backend integration:
     - fetch taken slots when date is selected  (GET /api/availability)
     - left-panel available counts              (GET /api/availability/lab)
     - create reservation on confirm            (POST /api/reservations)
   ============================================================ */

const API_BASE = "http://localhost:3000/api";

/* ── date selection ── */

function formatDateValue(date) {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day   = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
    return date.toLocaleDateString("en-PH", {
        month: "short",
        day:   "numeric",
        year:  "numeric"
    });
}

function populateDateOptions(dateId) {
    const dateSelect = document.getElementById(dateId);
    if (!dateSelect) return;

    const today = new Date();
    let added = 0, offset = 0;

    while (added < 7) {
        const current = new Date();
        current.setDate(today.getDate() + offset);

        if (current.getDay() !== 0) {
            const option = document.createElement("option");
            option.value       = formatDateValue(current);
            option.textContent = formatDateLabel(current);
            dateSelect.appendChild(option);
            added++;
        }
        offset++;
    }
}

populateDateOptions("res-date");
populateDateOptions("date-title");

/* ── time interval selection ── */

const dateSelect      = document.getElementById("res-date");
const startTimeSelect = document.getElementById("start-time");
const endTimeSelect   = document.getElementById("end-time");

function formatTimeValue(totalMinutes) {
    const hours   = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}`;
}

function formatTimeLabel(totalMinutes) {
    const hours   = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix  = hours >= 12 ? "PM" : "AM";
    let displayHour = hours % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getCurrentSlotStart() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return Math.floor(currentMinutes / 30) * 30;
}

function resetTimeOptions() {
    startTimeSelect.innerHTML = '<option value="">Select start time</option>';
    endTimeSelect.innerHTML   = '<option value="">Select end time</option>';
}

function populateStartTimes() {
    resetTimeOptions();

    const selectedDate      = dateSelect.value;
    const todayString       = formatDateValue(new Date());
    let minimumStartMinutes = 8 * 60;

    if (selectedDate === todayString) {
        minimumStartMinutes = Math.max(8 * 60, getCurrentSlotStart());
    }

    for (let m = minimumStartMinutes; m < 20 * 60; m += 30) {
        const option = document.createElement("option");
        option.value       = formatTimeValue(m);
        option.textContent = formatTimeLabel(m);
        startTimeSelect.appendChild(option);
    }
}

function populateEndTimes() {
    endTimeSelect.innerHTML = '<option value="">Select end time</option>';
    const selectedStart = startTimeSelect.value;
    if (!selectedStart) return;

    const startMinutes =
        parseInt(selectedStart.slice(0, 2), 10) * 60 +
        parseInt(selectedStart.slice(2, 4), 10);

    for (let m = startMinutes + 30; m <= 20 * 60; m += 30) {
        const option = document.createElement("option");
        option.value       = formatTimeValue(m);
        option.textContent = formatTimeLabel(m);
        endTimeSelect.appendChild(option);
    }
}

if (dateSelect && startTimeSelect && endTimeSelect) {
    populateStartTimes();
    dateSelect.addEventListener("change",      populateStartTimes);
    startTimeSelect.addEventListener("change", populateEndTimes);
}

/* ── lab/comp URL param handling ── */

document.addEventListener("DOMContentLoaded", function () {
    const params       = new URLSearchParams(window.location.search);
    const selectedLab  = params.get("lab");
    const selectedComp = params.get("comp");
    if (!selectedLab) return;

    const currentPage = window.location.pathname.split("/").pop();
    const compLinks   = document.querySelectorAll("a[data-comp]");

    if (currentPage === "s-rc-cs.html") {
        document.title = `Reserve Computer - L${selectedLab} Computer Selection`;
        const t = document.getElementById("panel-title");
        if (t) t.textContent = `Lab ${selectedLab} Computer Selection`;
        compLinks.forEach(link => {
            link.href = `s-rc-cs-c.html?lab=${selectedLab}&comp=${link.dataset.comp}`;
        });
    }

    if (currentPage === "s-rc-cs-c.html") {
        if (!selectedComp) return;
        document.title = `Reserve Computer - L${selectedLab}C${selectedComp} Reservation`;
        const t = document.getElementById("res-panel-title");
        if (t) t.textContent = `Lab ${selectedLab} Computer ${selectedComp} Reservation`;
        const c = document.getElementById("comp-title");
        if (c) c.textContent = `Comp ${selectedComp}`;
    }
});

/* ── schedule paging ── */

const schedDateSelect = document.getElementById("date-title");
const schedRows       = document.querySelectorAll(".sched-table .res-row");
const prevBtn         = document.getElementById("prev");
const nextBtn         = document.getElementById("next");

const slotsPerPage = 6;
let currentSchedulePage   = 0;
let currentScheduleDate   = "";
let selectedScheduleSlots = {};
let takenSlotsForDate     = [];   // filled from API

function generateScheduleSlots() {
    const slots = [];
    for (let m = 8 * 60; m < 20 * 60; m += 30) {
        slots.push({
            startValue: formatTimeValue(m),
            endValue:   formatTimeValue(m + 30),
            label:      `${formatTimeLabel(m)} - ${formatTimeLabel(m + 30)}`
        });
    }
    return slots;
}

const allScheduleSlots = generateScheduleSlots();

function parseDateValue(dateValue) {
    const parts = dateValue.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function isPastScheduleSlot(dateValue, slotIndex) {
    if (!dateValue) return false;

    const selectedDate = parseDateValue(dateValue);
    const today        = new Date();

    const selOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todOnly = new Date(today.getFullYear(),        today.getMonth(),        today.getDate());

    if (selOnly.getTime() !== todOnly.getTime()) return false;

    const currentSlotStart  = getCurrentSlotStart();
    const slotStartMinutes  = 8 * 60 + slotIndex * 30;
    return slotStartMinutes < currentSlotStart;
}

function isTakenSlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= allScheduleSlots.length) return false;
    return takenSlotsForDate.includes(allScheduleSlots[slotIndex].startValue);
}

function getSelectedSlotsForDate(dateValue) {
    if (!dateValue) return [];
    if (!selectedScheduleSlots[dateValue]) selectedScheduleSlots[dateValue] = [];
    return selectedScheduleSlots[dateValue];
}

function isContinuousSelection(slotIndexes) {
    if (slotIndexes.length <= 1) return true;
    const sorted = [...slotIndexes].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1] + 1) return false;
    }
    return true;
}

function formatTimeValueToLabel(tv) {
    return formatTimeLabel(parseInt(tv.slice(0, 2), 10) * 60 + parseInt(tv.slice(2, 4), 10));
}

function getSelectedTimeRangeLabel() {
    if (!currentScheduleDate) return "";
    const idx = getSelectedSlotsForDate(currentScheduleDate);
    if (!idx.length) return "";
    const sorted = [...idx].sort((a, b) => a - b);
    return `${formatTimeValueToLabel(allScheduleSlots[sorted[0]].startValue)} - ${formatTimeValueToLabel(allScheduleSlots[sorted[sorted.length - 1]].endValue)}`;
}

function getSelectedTimeValues() {
    if (!currentScheduleDate) return null;
    const idx = getSelectedSlotsForDate(currentScheduleDate);
    if (!idx.length) return null;
    const sorted = [...idx].sort((a, b) => a - b);
    return {
        start_time: allScheduleSlots[sorted[0]].startValue,
        end_time:   allScheduleSlots[sorted[sorted.length - 1]].endValue
    };
}

function handleSlotSelection(slotIndex, isChecked) {
    if (!currentScheduleDate) return false;
    if (isPastScheduleSlot(currentScheduleDate, slotIndex)) return false;
    if (isTakenSlot(slotIndex)) return false;

    let selected = [...getSelectedSlotsForDate(currentScheduleDate)];

    if (isChecked) {
        if (!selected.includes(slotIndex)) selected.push(slotIndex);
    } else {
        selected = selected.filter(i => i !== slotIndex);
    }

    if (!isContinuousSelection(selected)) return false;
    selectedScheduleSlots[currentScheduleDate] = selected.sort((a, b) => a - b);
    return true;
}

function fillSchedulePage() {
    if (!schedRows.length) return;

    const visible  = allScheduleSlots.slice(
        currentSchedulePage * slotsPerPage,
        currentSchedulePage * slotsPerPage + slotsPerPage
    );
    const selected = getSelectedSlotsForDate(currentScheduleDate);

    schedRows.forEach((row, index) => {
        const checkbox = row.querySelector(".res-check");
        const timeCell = row.querySelector(".comp-time");
        const slotCell = row.querySelector(".slot");
        const slot     = visible[index];
        const slotIdx  = currentSchedulePage * slotsPerPage + index;

        if (!slot) {
            timeCell.textContent = "";
            slotCell.innerHTML   = "";
            checkbox.checked     = false;
            checkbox.disabled    = true;
            checkbox.removeAttribute("data-slot-index");
            return;
        }

        timeCell.textContent = slot.label;
        checkbox.setAttribute("data-slot-index", slotIdx);

        const isPast  = isPastScheduleSlot(currentScheduleDate, slotIdx);
        const isTaken = isTakenSlot(slotIdx);

        checkbox.disabled     = isPast || isTaken;
        checkbox.checked      = !isPast && !isTaken && selected.includes(slotIdx);
        slotCell.textContent  = isTaken ? "Reserved" : "";
        slotCell.style.color  = isTaken ? "#c87f7f"  : "";
    });

    updateScheduleNavButtons();
    updateConfirmDetails();
}

function updateScheduleNavButtons() {
    if (!prevBtn || !nextBtn) return;
    const totalPages = Math.ceil(allScheduleSlots.length / slotsPerPage);
    prevBtn.classList.toggle("enabled", !!currentScheduleDate && currentSchedulePage > 0);
    nextBtn.classList.toggle("enabled", !!currentScheduleDate && currentSchedulePage < totalPages - 1);
}

function updateConfirmDetails() {
    const confirmDate = document.querySelector(".date-select p:last-child");
    const confirmTime = document.querySelector(".time-select p:last-child");
    if (confirmDate) confirmDate.textContent = currentScheduleDate ? formatDateLabel(new Date(currentScheduleDate)) : "";
    if (confirmTime) confirmTime.textContent = getSelectedTimeRangeLabel();
}

function clearScheduleTable() {
    schedRows.forEach(row => {
        const checkbox = row.querySelector(".res-check");
        row.querySelector(".comp-time").textContent = "";
        row.querySelector(".slot").innerHTML        = "";
        checkbox.checked  = false;
        checkbox.disabled = true;
        checkbox.removeAttribute("data-slot-index");
    });
}

// fetch taken slots from API, then render
async function loadScheduleForDate(selectedDate) {
    currentScheduleDate   = selectedDate;
    currentSchedulePage   = 0;
    selectedScheduleSlots = {};
    takenSlotsForDate     = [];

    if (!selectedDate) {
        clearScheduleTable();
        updateScheduleNavButtons();
        updateConfirmDetails();
        return;
    }

    const params       = new URLSearchParams(window.location.search);
    const selectedLab  = params.get("lab");
    const selectedComp = params.get("comp");

    if (selectedLab && selectedComp) {
        try {
            const res  = await fetch(
                `${API_BASE}/availability?lab_id=${selectedLab}&computer_no=${selectedComp}&date=${selectedDate}`
            );
            const data = await res.json();
            takenSlotsForDate = data.takenSlots || [];
        } catch (err) {
            console.error("Could not fetch availability:", err);
        }
    }

    fillSchedulePage();
}

if (schedDateSelect) {
    schedDateSelect.addEventListener("change", function () {
        loadScheduleForDate(this.value);
    });
}

schedRows.forEach(row => {
    const checkbox = row.querySelector(".res-check");
    checkbox.addEventListener("change", function () {
        const slotIdx = parseInt(this.getAttribute("data-slot-index"), 10);
        const success = handleSlotSelection(slotIdx, this.checked);
        if (!success) this.checked = !this.checked;
        updateConfirmDetails();
    });
});

if (prevBtn) {
    prevBtn.addEventListener("click", function () {
        if (!currentScheduleDate || currentSchedulePage <= 0) return;
        currentSchedulePage--;
        fillSchedulePage();
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", function () {
        if (!currentScheduleDate) return;
        const totalPages = Math.ceil(allScheduleSlots.length / slotsPerPage);
        if (currentSchedulePage < totalPages - 1) { currentSchedulePage++; fillSchedulePage(); }
    });
}

clearScheduleTable();
updateScheduleNavButtons();
updateConfirmDetails();

/* ── left-panel availability counts (s-rc-ls.html) ── */

document.addEventListener("DOMContentLoaded", function () {
    const checkBtn  = document.querySelector(".avail-btn.enabled");
    const resetBtn  = document.querySelector(".avail-btn:not(.enabled)");
    const labAvails = document.querySelectorAll(".lab-avail");
    if (!checkBtn || !labAvails.length) return;

    checkBtn.addEventListener("click", async function () {
        const date      = document.getElementById("res-date")?.value;
        const startTime = document.getElementById("start-time")?.value;
        const endTime   = document.getElementById("end-time")?.value;

        if (!date || !startTime || !endTime) {
            alert("Please select a date, start time, and end time first.");
            return;
        }

        try {
            const res  = await fetch(
                `${API_BASE}/availability/lab?date=${date}&start_time=${startTime}&end_time=${endTime}`
            );
            const data = await res.json();
            labAvails.forEach((el, i) => {
                el.textContent = data[i] ? `${data[i].available} / ${data[i].total}` : "-";
            });
        } catch (err) {
            console.error("Could not fetch lab availability:", err);
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", function () {
            labAvails.forEach(el => { el.textContent = ""; });
            if (dateSelect)      dateSelect.value = "";
            if (startTimeSelect) startTimeSelect.innerHTML = '<option value="">Select start time</option>';
            if (endTimeSelect)   endTimeSelect.innerHTML   = '<option value="">Select end time</option>';
        });
    }
});

/* ── confirm popup ── */

const confirmBtn   = document.getElementById("confirm-btn");
const confirmPopup = document.getElementById("confirm-popup");
const yesBtn       = document.getElementById("yes-btn");
const noBtn        = document.getElementById("no-btn");

function getReservationDetails() {
    const params       = new URLSearchParams(window.location.search);
    const selectedLab  = params.get("lab")  || "";
    const selectedComp = params.get("comp") || "";
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

    return {
        lab:      selectedLab,
        comp:     selectedComp,
        date:     currentScheduleDate ? formatDateLabel(new Date(currentScheduleDate)) : "",
        time:     getSelectedTimeRangeLabel(),
        setUnder: loggedInUser.name || `ID: ${loggedInUser._id}` || "Unknown"
    };
}

function fillConfirmPopup() {
    if (!confirmPopup) return;
    const d  = getReservationDetails();
    const ps = confirmPopup.querySelectorAll("p");
    if (ps[1]) ps[1].textContent = `Laboratory: Lab ${d.lab}`;
    if (ps[2]) ps[2].textContent = `Computer: Comp ${d.comp}`;
    if (ps[3]) ps[3].textContent = `Date: ${d.date}`;
    if (ps[4]) ps[4].textContent = `Time: ${d.time}`;
    if (ps[5]) ps[5].textContent = `Set under: ${d.setUnder}`;
}

function openConfirmPopup()  { if (confirmPopup) { fillConfirmPopup(); confirmPopup.style.display = "block"; } }
function closeConfirmPopup() { if (confirmPopup) confirmPopup.style.display = "none"; }

if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
        if (!currentScheduleDate) { alert("Please select a date first."); return; }
        if (!getSelectedSlotsForDate(currentScheduleDate).length) { alert("Please select at least one time slot."); return; }
        openConfirmPopup();
    });
}

if (noBtn) noBtn.addEventListener("click", closeConfirmPopup);

if (yesBtn) {
    yesBtn.addEventListener("click", async function () {
        closeConfirmPopup();

        const params       = new URLSearchParams(window.location.search);
        const selectedLab  = params.get("lab");
        const selectedComp = params.get("comp");
        const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
        const timeValues   = getSelectedTimeValues();

        if (!timeValues || !selectedLab || !selectedComp || !currentScheduleDate) {
            alert("Missing reservation details.");
            return;
        }

        const anonCheck = document.getElementById("anon-check");
        const isAnon    = anonCheck ? anonCheck.checked : false;

        try {
            const res  = await fetch(`${API_BASE}/reservations`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id:      loggedInUser._id,
                    lab_id:       Number(selectedLab),
                    computer_no:  Number(selectedComp),
                    date:         currentScheduleDate,
                    start_time:   timeValues.start_time,
                    end_time:     timeValues.end_time,
                    is_anonymous: isAnon
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                alert("Reservation created successfully!");
                await loadScheduleForDate(currentScheduleDate);
            } else {
                alert(data.message || "Failed to create reservation.");
            }
        } catch (err) {
            alert("Could not connect to server.");
            console.error(err);
        }
    });
}
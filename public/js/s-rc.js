const API_BASE = "/api";

/* ── date selection ── */

function formatDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
    return date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function populateDateOptions(dateId) {
    const dateSelect = document.getElementById(dateId);
    if (!dateSelect) return;

    const today = new Date();
    let added = 0;
    let offset = 0;

    while (added < 7) {
        const current = new Date();
        current.setDate(today.getDate() + offset);

        if (current.getDay() !== 0) {
            const option = document.createElement("option");
            option.value = formatDateValue(current);
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

const dateSelect = document.getElementById("res-date");
const startTimeSelect = document.getElementById("start-time");
const endTimeSelect = document.getElementById("end-time");

function formatTimeValue(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}`;
}

function formatTimeLabel(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const suffix = hours >= 12 ? "PM" : "AM";

    let displayHour = hours % 12;
    if (displayHour === 0) {
        displayHour = 12;
    }

    return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getCurrentSlotStart() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return Math.floor(currentMinutes / 30) * 30;
}

function resetTimeOptions() {
    if (startTimeSelect) {
        startTimeSelect.innerHTML = '<option value="">Select start time</option>';
    }

    if (endTimeSelect) {
        endTimeSelect.innerHTML = '<option value="">Select end time</option>';
    }
}

function populateStartTimes() {
    if (!dateSelect || !startTimeSelect || !endTimeSelect) return;

    resetTimeOptions();

    const selectedDate = dateSelect.value;
    const todayString = formatDateValue(new Date());

    let minimumStartMinutes = 8 * 60;

    if (selectedDate === todayString) {
        minimumStartMinutes = Math.max(8 * 60, getCurrentSlotStart());
    }

    for (let minutes = minimumStartMinutes; minutes < 20 * 60; minutes += 30) {
        const option = document.createElement("option");
        option.value = formatTimeValue(minutes);
        option.textContent = formatTimeLabel(minutes);
        startTimeSelect.appendChild(option);
    }
}

function populateEndTimes() {
    if (!startTimeSelect || !endTimeSelect) return;

    endTimeSelect.innerHTML = '<option value="">Select end time</option>';

    const selectedStart = startTimeSelect.value;
    if (!selectedStart) return;

    const startMinutes =
        parseInt(selectedStart.slice(0, 2), 10) * 60 +
        parseInt(selectedStart.slice(2, 4), 10);

    for (let minutes = startMinutes + 30; minutes <= 20 * 60; minutes += 30) {
        const option = document.createElement("option");
        option.value = formatTimeValue(minutes);
        option.textContent = formatTimeLabel(minutes);
        endTimeSelect.appendChild(option);
    }
}

if (dateSelect && startTimeSelect && endTimeSelect) {
    populateStartTimes();

    dateSelect.addEventListener("change", function () {
        populateStartTimes();
    });

    startTimeSelect.addEventListener("change", function () {
        populateEndTimes();
    });
}

/* ── helper functions ── */

function getSelectedLab() {
    const params = new URLSearchParams(window.location.search);
    return params.get("lab") || "";
}

function getSelectedComp() {
    const params = new URLSearchParams(window.location.search);
    return params.get("comp") || "";
}

function getSelectedDate(dateValue) {
    const parts = dateValue.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getLoggedInUser() {
    return JSON.parse(
        localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
    );
}

function getCurrentStudentId() {
    const loggedInUser = getLoggedInUser();
    return loggedInUser._id || "";
}

function getCurrentStudentName() {
    const loggedInUser = getLoggedInUser();
    return loggedInUser.name || "";
}

function getComputerId() {
    const selectedLab = Number(getSelectedLab());
    const selectedComp = Number(getSelectedComp());

    if (!selectedLab || !selectedComp) {
        return "";
    }

    return ((selectedLab - 1) * 10) + selectedComp;
}

function getReservationId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("reservation_id") || "";
}

function updateEditDateDisplay(dateValue) {
    const dateEdit = document.getElementById("date-edit");
    if (!dateEdit) return;

    if (!dateValue) {
        dateEdit.textContent = "";
        return;
    }

    dateEdit.textContent = formatDateLabel(getSelectedDate(dateValue));
}

/* ── lab/comp URL param handling ── */

document.addEventListener("DOMContentLoaded", function () {
    const selectedLab = getSelectedLab();
    const selectedComp = getSelectedComp();

    if (!selectedLab) {
        return;
    }

    const currentPage = window.location.pathname.split("/").pop();
    const compLinks = document.querySelectorAll("a[data-comp]");

    if (currentPage === "s-rc-cs.html") {
        document.title = `Reserve Computer - L${selectedLab} Computer Selection`;

        const panelTitle = document.getElementById("panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer Selection`;
        }

        compLinks.forEach(function (link) {
            link.href = `s-rc-cs-c.html?lab=${selectedLab}&comp=${link.dataset.comp}`;
        });
    }

    if (currentPage === "s-rc-cs-c.html") {
        if (!selectedComp) return;

        document.title = `Reserve Computer - L${selectedLab}C${selectedComp} Reservation`;

        const panelTitle = document.getElementById("res-panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer ${selectedComp} Reservation`;
        }

        const compLabel = document.getElementById("comp-title");
        if (compLabel) {
            compLabel.textContent = `Comp ${selectedComp}`;
        }
    }

    if (currentPage === "s-rc-cs-ce.html") {
        if (!selectedComp) return;
    
        document.title = `Edit Reservation - L${selectedLab}C${selectedComp}`;
    
        const panelTitle = document.getElementById("res-panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer ${selectedComp} Reservation`;
        }
    
        const compLabel = document.getElementById("comp-title");
        if (compLabel) {
            compLabel.textContent = `Comp ${selectedComp}`;
        }
    }
});

/* ── schedule paging ── */

const schedDateSelect = document.getElementById("date-title");
const schedRows = document.querySelectorAll(".sched-table .res-row");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const currentPageName = window.location.pathname.split("/").pop();
const isReservePage = currentPageName === "s-rc-cs-c.html";
const isEditReservationPage = currentPageName === "s-rc-cs-ce.html";

const slotsPerPage = 6;

let currentSchedulePage = 0;
let currentScheduleDate = "";
let selectedScheduleSlots = {};
let reservedScheduleSlots = {};
let selectedReservationId = "";
let selectedReservationInfo = null;
let originalReservationInfo = null;
let originalReservationSlotIndexes = [];

function generateScheduleSlots() {
    const slots = [];

    for (let startMinutes = 8 * 60; startMinutes < 20 * 60; startMinutes += 30) {
        const endMinutes = startMinutes + 30;

        slots.push({
            startValue: formatTimeValue(startMinutes),
            endValue: formatTimeValue(endMinutes),
            label: `${formatTimeLabel(startMinutes)} - ${formatTimeLabel(endMinutes)}`
        });
    }

    return slots;
}

const allScheduleSlots = generateScheduleSlots();

function isPastScheduleSlot(dateValue, slotIndex) {
    if (!dateValue) return false;

    const selectedDate = getSelectedDate(dateValue);
    const today = new Date();

    const selectedDateOnly = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    );

    const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    if (selectedDateOnly.getTime() !== todayOnly.getTime()) {
        return false;
    }

    const currentSlotStart = getCurrentSlotStart();
    const slotStartMinutes = 8 * 60 + (slotIndex * 30);

    return slotStartMinutes < currentSlotStart;
}

function getSelectedSlotsForDate(dateValue) {
    if (!dateValue) return [];

    if (!selectedScheduleSlots[dateValue]) {
        selectedScheduleSlots[dateValue] = [];
    }

    return selectedScheduleSlots[dateValue];
}

function isContinuousSelection(slotIndexes) {
    if (slotIndexes.length <= 1) return true;

    const sorted = [...slotIndexes].sort(function (a, b) {
        return a - b;
    });

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1] + 1) {
            return false;
        }
    }

    return true;
}

function formatTimeValueToLabel(timeValue) {
    const hours = parseInt(timeValue.slice(0, 2), 10);
    const minutes = parseInt(timeValue.slice(2, 4), 10);
    return formatTimeLabel(hours * 60 + minutes);
}

function getSelectedTimeRangeLabel() {
    if (!currentScheduleDate) return "";

    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);
    if (!selectedIndexes.length) return "";

    const sorted = [...selectedIndexes].sort(function (a, b) {
        return a - b;
    });

    const firstSlot = allScheduleSlots[sorted[0]];
    const lastSlot = allScheduleSlots[sorted[sorted.length - 1]];

    return `${formatTimeValueToLabel(firstSlot.startValue)} - ${formatTimeValueToLabel(lastSlot.endValue)}`;
}

function getReservationStartTime() {
    if (!currentScheduleDate) return "";

    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);
    if (!selectedIndexes.length) return "";

    const sorted = [...selectedIndexes].sort(function (a, b) {
        return a - b;
    });

    return allScheduleSlots[sorted[0]].startValue;
}

function getReservationEndTime() {
    if (!currentScheduleDate) return "";

    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);
    if (!selectedIndexes.length) return "";

    const sorted = [...selectedIndexes].sort(function (a, b) {
        return a - b;
    });

    return allScheduleSlots[sorted[sorted.length - 1]].endValue;
}

function isReservedScheduleSlot(dateValue, slotIndex) {
    if (!dateValue) return false;

    if (!reservedScheduleSlots[dateValue]) {
        return false;
    }

    return !!reservedScheduleSlots[dateValue][slotIndex];
}

function getReservedSlotInfo(dateValue, slotIndex) {
    if (!dateValue) return null;

    if (!reservedScheduleSlots[dateValue]) {
        return null;
    }

    return reservedScheduleSlots[dateValue][slotIndex] || null;
}

function handleSlotSelection(slotIndex, isChecked) {
    if (!currentScheduleDate) return false;

    if (isPastScheduleSlot(currentScheduleDate, slotIndex)) {
        return false;
    }

    if (isReservedScheduleSlot(currentScheduleDate, slotIndex)) {
        return false;
    }

    let selectedIndexes = [...getSelectedSlotsForDate(currentScheduleDate)];

    if (isChecked) {
        if (!selectedIndexes.includes(slotIndex)) {
            selectedIndexes.push(slotIndex);
        }
    } else {
        selectedIndexes = selectedIndexes.filter(function (index) {
            return index !== slotIndex;
        });
    }

    if (!isContinuousSelection(selectedIndexes)) {
        return false;
    }

    selectedScheduleSlots[currentScheduleDate] = selectedIndexes.sort(function (a, b) {
        return a - b;
    });

    return true;
}

function getVisibleScheduleSlots() {
    const startIndex = currentSchedulePage * slotsPerPage;
    const endIndex = startIndex + slotsPerPage;
    return allScheduleSlots.slice(startIndex, endIndex);
}

function getReservationSlotIndexes(startTime, endTime) {
    const indexes = [];

    for (let i = 0; i < allScheduleSlots.length; i++) {
        const slot = allScheduleSlots[i];

        if (slot.startValue >= startTime && slot.endValue <= endTime) {
            indexes.push(i);
        }
    }

    return indexes;
}

function arraysHaveCommonSlot(first, second) {
    return first.some(function (value) {
        return second.includes(value);
    });
}

function canEditSelection(dateValue, slotIndexes) {
    if (!isEditReservationPage) return true;
    if (!originalReservationInfo || !dateValue) return false;
    if (dateValue !== originalReservationInfo.date) return false;
    if (!slotIndexes.length) return false;

    const sorted = [...slotIndexes].sort(function (a, b) {
        return a - b;
    });

    if (!isContinuousSelection(sorted)) {
        return false;
    }

    if (!arraysHaveCommonSlot(sorted, originalReservationSlotIndexes)) {
        return false;
    }

    for (const slotIndex of sorted) {
        const reservedInfo = getReservedSlotInfo(dateValue, slotIndex);

        if (
            reservedInfo &&
            (!originalReservationInfo._id || reservedInfo.reservation._id !== originalReservationInfo._id)
        ) {
            return false;
        }
    }

    return true;
}

async function loadOriginalReservationForEdit() {
    const reservationId = getReservationId();

    if (!isEditReservationPage || !reservationId) {
        return;
    }

    const response = await fetch(`${API_BASE}/reservation/${reservationId}`);

    if (!response.ok) {
        throw new Error("Failed to load reservation to edit");
    }

    const reservation = await response.json();

    if (!reservation || reservation.status !== "active") {
        throw new Error("Selected reservation is not editable");
    }

    const currentStudentId = String(getCurrentStudentId() || "");
    const reservationOwnerId = String(reservation.user_id || "");

    if (!currentStudentId || !reservationOwnerId || reservationOwnerId !== currentStudentId) {
        throw new Error("You are not allowed to edit this reservation");
    }

    originalReservationInfo = reservation;
    selectedReservationId = reservation._id;
    selectedReservationInfo = reservation;
    currentScheduleDate = reservation.date;
    originalReservationSlotIndexes = getReservationSlotIndexes(
        reservation.start_time,
        reservation.end_time
    );
    selectedScheduleSlots[reservation.date] = [...originalReservationSlotIndexes];
}

async function fetchComputerReservations(dateValue) {
    const selectedLab = getSelectedLab();
    const actualComputerId = getComputerId();

    if (!selectedLab || !actualComputerId || !dateValue) {
        return;
    }

    try {
        const query = new URLSearchParams({
            lab_id: selectedLab,
            computer_id: actualComputerId,
            date: dateValue
        });

        const response = await fetch(`${API_BASE}/comps/reservations?${query.toString()}`);
        const reservations = await response.json();

        reservedScheduleSlots[dateValue] = {};

        reservations.forEach(function (reservation) {
            const slotIndexes = getReservationSlotIndexes(reservation.start_time, reservation.end_time);

            slotIndexes.forEach(function (slotIndex) {
                reservedScheduleSlots[dateValue][slotIndex] = {
                    isAnonymous: reservation.is_anonymous === true,
                    reservedBy: reservation.reserved_by || "Reserved",
                    userId: reservation.user_id,
                    reservation: reservation
                };
            });
        });
    } catch (error) {
        console.error("Error fetching computer reservations:", error);
        reservedScheduleSlots[dateValue] = {};
    }
}

function fillSchedulePage() {
    if (!schedRows.length) return;

    const visibleSlots = getVisibleScheduleSlots();
    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);

    schedRows.forEach(function (row, index) {
        const checkbox = row.querySelector(".res-check");
        const timeCell = row.querySelector(".comp-time");
        const slotCell = row.querySelector(".slot");

        const slot = visibleSlots[index];
        const slotIndex = currentSchedulePage * slotsPerPage + index;

        if (!slot) {
            timeCell.textContent = "";
            slotCell.innerHTML = "";
            checkbox.checked = false;
            checkbox.disabled = true;
            checkbox.removeAttribute("data-slot-index");
            return;
        }

        timeCell.textContent = slot.label;
        checkbox.setAttribute("data-slot-index", slotIndex);
        checkbox.checked = selectedIndexes.includes(slotIndex);

        const reservedInfo = getReservedSlotInfo(currentScheduleDate, slotIndex);

        if (reservedInfo) {
            const displayName = reservedInfo.reservedBy || "Reserved";
            const currentUserId = String(getCurrentStudentId() || "");
            const reservedUserId = String(reservedInfo.userId || "");
            
            if (reservedInfo.isAnonymous && reservedUserId !== currentUserId) {
                slotCell.textContent = "Anonymous";
            } else {
                if (reservedUserId) {
                    let profileUrl = "";
        
                    if (reservedUserId === currentUserId) {
                        profileUrl = "/views/student/userprofile_student.html";
                    } else {
                        profileUrl = `/views/other-student/userprofile_student_other.html?student_id=${reservedUserId}`;
                    }
        
                    slotCell.innerHTML = `<a href="${profileUrl}">${displayName}</a>`;
                } else {
                    slotCell.textContent = displayName;
                }
            }
        } else {
            slotCell.innerHTML = "";
        }

        if (isEditReservationPage) {
            const isOriginalReservationSlot =
                reservedInfo &&
                originalReservationInfo &&
                reservedInfo.reservation &&
                reservedInfo.reservation._id === originalReservationInfo._id;
        
            checkbox.checked = selectedIndexes.includes(slotIndex);
        
            if (isPastScheduleSlot(currentScheduleDate, slotIndex) && !isOriginalReservationSlot) {
                checkbox.disabled = true;
            } else if (reservedInfo && !isOriginalReservationSlot) {
                checkbox.disabled = true;
            } else {
                checkbox.disabled = false;
            }
        
            return;
        }
        
        if (isPastScheduleSlot(currentScheduleDate, slotIndex) || reservedInfo) {
            checkbox.checked = false;
            checkbox.disabled = true;
        } else {
            checkbox.disabled = false;
        }
    });

    updateScheduleNavButtons();
    updateConfirmDetails();
}

function updateScheduleNavButtons() {
    if (!prevBtn || !nextBtn) return;

    const totalPages = Math.ceil(allScheduleSlots.length / slotsPerPage);

    if (!currentScheduleDate || currentSchedulePage === 0) {
        prevBtn.classList.remove("enabled");
    } else {
        prevBtn.classList.add("enabled");
    }

    if (!currentScheduleDate || currentSchedulePage === totalPages - 1) {
        nextBtn.classList.remove("enabled");
    } else {
        nextBtn.classList.add("enabled");
    }
}

function updateConfirmDetails() {
    const confirmDate = document.querySelector(".date-select p:last-child");
    const confirmTime = document.querySelector(".time-select p:last-child");

    if (confirmDate) {
        if (currentScheduleDate) {
            confirmDate.textContent = formatDateLabel(getSelectedDate(currentScheduleDate));
        } else {
            confirmDate.textContent = "";
        }
    }

    if (confirmTime) {
        confirmTime.textContent = getSelectedTimeRangeLabel();
    }
}

function clearScheduleTable() {
    schedRows.forEach(function (row) {
        const checkbox = row.querySelector(".res-check");
        const timeCell = row.querySelector(".comp-time");
        const slotCell = row.querySelector(".slot");

        timeCell.textContent = "";
        slotCell.innerHTML = "";
        checkbox.checked = false;
        checkbox.disabled = true;
        checkbox.removeAttribute("data-slot-index");
    });
}

async function loadScheduleForDate(selectedDate) {
    currentScheduleDate = selectedDate;
    currentSchedulePage = 0;
    selectedScheduleSlots = {};
    selectedReservationId = "";
    selectedReservationInfo = null;

    if (isEditReservationPage && originalReservationInfo) {
        selectedReservationId = originalReservationInfo._id;
        selectedReservationInfo = originalReservationInfo;
        selectedScheduleSlots[selectedDate] = [...originalReservationSlotIndexes];
    }

    if (!selectedDate) {
        clearScheduleTable();
        updateScheduleNavButtons();
        updateConfirmDetails();
        return;
    }

    await fetchComputerReservations(selectedDate);
    fillSchedulePage();
}

if (schedDateSelect) {
    schedDateSelect.addEventListener("change", async function () {
        await loadScheduleForDate(this.value);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        if (isEditReservationPage) {
            await loadOriginalReservationForEdit();

            if (originalReservationInfo) {
                updateEditDateDisplay(originalReservationInfo.date);

                if (anonCheck) {
                    anonCheck.checked = originalReservationInfo.is_anonymous === true;
                }

                await loadScheduleForDate(originalReservationInfo.date);
                selectedScheduleSlots[originalReservationInfo.date] = [...originalReservationSlotIndexes];
                fillSchedulePage();
                updateConfirmDetails();
                return;
            }
        }

        if (!schedDateSelect) return;

        if (!schedDateSelect.value && schedDateSelect.options.length > 1) {
            schedDateSelect.selectedIndex = 1;
        }

        if (schedDateSelect.value) {
            await loadScheduleForDate(schedDateSelect.value);
        }
    } catch (error) {
        console.error(error);
        alert(error.message || "Could not load reservation.");
    }
});

schedRows.forEach(function (row) {
    const checkbox = row.querySelector(".res-check");
    if (!checkbox) return;

    checkbox.addEventListener("change", function () {
        if (!currentScheduleDate) {
            this.checked = false;
            return;
        }

        const slotIndex = parseInt(this.getAttribute("data-slot-index"), 10);
        const reservedInfo = getReservedSlotInfo(currentScheduleDate, slotIndex);

        if (isEditReservationPage) {
            const isOriginalReservationSlot =
                reservedInfo &&
                originalReservationInfo &&
                reservedInfo.reservation &&
                reservedInfo.reservation._id === originalReservationInfo._id;

            if (isPastScheduleSlot(currentScheduleDate, slotIndex) && !isOriginalReservationSlot) {
                this.checked = false;
                return;
            }

            if (reservedInfo && !isOriginalReservationSlot) {
                this.checked = false;
                return;
            }

            let selectedIndexes = [...getSelectedSlotsForDate(currentScheduleDate)];

            if (this.checked) {
                if (!selectedIndexes.includes(slotIndex)) {
                    selectedIndexes.push(slotIndex);
                }
            } else {
                selectedIndexes = selectedIndexes.filter(function (index) {
                    return index !== slotIndex;
                });
            }

            selectedIndexes.sort(function (a, b) {
                return a - b;
            });

            if (!canEditSelection(currentScheduleDate, selectedIndexes)) {
                this.checked = !this.checked;
                return;
            }

            selectedScheduleSlots[currentScheduleDate] = selectedIndexes;
            fillSchedulePage();
            return;
        }

        const success = handleSlotSelection(slotIndex, this.checked);

        if (!success) {
            this.checked = !this.checked;
        }

        updateConfirmDetails();
    });
});

if (prevBtn) {
    prevBtn.addEventListener("click", function () {
        if (!currentScheduleDate) return;

        if (currentSchedulePage > 0) {
            currentSchedulePage--;
            fillSchedulePage();
        }
    });
}

if (nextBtn) {
    nextBtn.addEventListener("click", function () {
        if (!currentScheduleDate) return;

        const totalPages = Math.ceil(allScheduleSlots.length / slotsPerPage);

        if (currentSchedulePage < totalPages - 1) {
            currentSchedulePage++;
            fillSchedulePage();
        }
    });
}

clearScheduleTable();
updateScheduleNavButtons();
updateConfirmDetails();

/* ── lab availability ── */

const labAvailBtn = document.getElementById("lab-avail-btn");
const labResetBtn = document.getElementById("lab-reset-btn");
const labCards = document.querySelectorAll(".panel-body .lab");
const labLinks = document.querySelectorAll(".panel-body .lab .lab-title a");

async function checkLabAvailability() {
    try {
        const query = new URLSearchParams({
            date: dateSelect.value,
            start_time: startTimeSelect.value,
            end_time: endTimeSelect.value
        });

        const response = await fetch(`${API_BASE}/labs/availability?${query.toString()}`);
        const labs = await response.json();

        displayLabAvailability(labs);
    } catch (error) {
        console.error("Error checking lab availability:", error);
    }
}

function displayLabAvailability(labs) {
    labs.forEach(function (lab) {
        const labAvail = document.querySelector(`.lab-avail[data-lab="${lab.lab_id}"]`);
        const labIndex = lab.lab_id - 1;

        if (labAvail) {
            labAvail.textContent = `${lab.available_computers}/10`;
        }

        if (lab.available_computers <= 0) {
            if (labCards[labIndex]) {
                labCards[labIndex].classList.add("disabled");
            }

            if (labLinks[labIndex]) {
                labLinks[labIndex].removeAttribute("href");
                labLinks[labIndex].style.pointerEvents = "none";
            }
        } else {
            if (labCards[labIndex]) {
                labCards[labIndex].classList.remove("disabled");
            }

            if (labLinks[labIndex]) {
                labLinks[labIndex].href = `s-rc-cs.html?lab=${lab.lab_id}`;
                labLinks[labIndex].style.pointerEvents = "auto";
            }
        }
    });
}

function resetReservationFilter() {
    if (dateSelect) {
        dateSelect.selectedIndex = 0;
    }

    if (startTimeSelect) {
        startTimeSelect.innerHTML = '<option value="">Select start time</option>';
    }

    if (endTimeSelect) {
        endTimeSelect.innerHTML = '<option value="">Select end time</option>';
    }

    const labAvailList = document.querySelectorAll(".lab-avail");

    labAvailList.forEach(function (labAvail) {
        labAvail.textContent = "";
    });

    labCards.forEach(function (labCard) {
        labCard.classList.remove("disabled");
    });

    labLinks.forEach(function (labLink, index) {
        labLink.href = `s-rc-cs.html?lab=${index + 1}`;
        labLink.style.pointerEvents = "auto";
    });

    populateStartTimes();
}

if (labAvailBtn) {
    labAvailBtn.addEventListener("click", function () {
        checkLabAvailability();
    });
}

if (labResetBtn) {
    labResetBtn.addEventListener("click", function (event) {
        event.preventDefault();
        resetReservationFilter();
    });
}

/* ── comp availability ── */

const compAvailBtn = document.getElementById("comp-avail-btn");
const compResetBtn = document.getElementById("comp-reset-btn");
const compCards = document.querySelectorAll(".panel-body .comp");
const compLinks = document.querySelectorAll(".panel-body .comp .comp-title a");

async function checkComputerAvailability() {
    try {
        const selectedLab = getSelectedLab();

        const query = new URLSearchParams({
            lab_id: selectedLab,
            date: dateSelect.value,
            start_time: startTimeSelect.value,
            end_time: endTimeSelect.value
        });

        const response = await fetch(`${API_BASE}/comps/availability?${query.toString()}`);
        const computers = await response.json();

        displayComputerAvailability(computers, selectedLab);
    } catch (error) {
        console.error("Error checking computer availability:", error);
    }
}

function displayComputerAvailability(computers, selectedLab) {
    computers.forEach(function (computer) {
        const compIndex = computer.comp_no - 1;

        if (computer.available === false) {
            if (compCards[compIndex]) {
                compCards[compIndex].classList.add("disabled");
            }

            if (compLinks[compIndex]) {
                compLinks[compIndex].removeAttribute("href");
                compLinks[compIndex].style.pointerEvents = "none";
            }
        } else {
            if (compCards[compIndex]) {
                compCards[compIndex].classList.remove("disabled");
            }

            if (compLinks[compIndex]) {
                compLinks[compIndex].href = `s-rc-cs-c.html?lab=${selectedLab}&comp=${computer.comp_no}`;
                compLinks[compIndex].style.pointerEvents = "auto";
            }
        }
    });
}

function resetComputerFilter() {
    if (dateSelect) {
        dateSelect.selectedIndex = 0;
    }

    if (startTimeSelect) {
        startTimeSelect.innerHTML = '<option value="">Select start time</option>';
    }

    if (endTimeSelect) {
        endTimeSelect.innerHTML = '<option value="">Select end time</option>';
    }

    compCards.forEach(function (compCard) {
        compCard.classList.remove("disabled");
    });

    const selectedLab = getSelectedLab();

    compLinks.forEach(function (compLink, index) {
        compLink.href = `s-rc-cs-c.html?lab=${selectedLab}&comp=${index + 1}`;
        compLink.style.pointerEvents = "auto";
    });

    populateStartTimes();
}

if (compAvailBtn) {
    compAvailBtn.addEventListener("click", function () {
        checkComputerAvailability();
    });
}

if (compResetBtn) {
    compResetBtn.addEventListener("click", function (event) {
        event.preventDefault();
        resetComputerFilter();
    });
}

/* ── confirm popup ── */

const confirmBtn = document.getElementById("confirm-btn");
const confirmPopup = document.getElementById("confirm-popup");
const returnBtn = document.getElementById("return-btn");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const anonCheck = document.getElementById("anon-check");

function getReservationDetails() {
    const selectedLab = getSelectedLab();
    const selectedComp = getSelectedComp();

    let selectedDateLabel = "";
    if (currentScheduleDate) {
        selectedDateLabel = formatDateLabel(getSelectedDate(currentScheduleDate));
    }

    return {
        lab: selectedLab,
        comp: selectedComp,
        date: selectedDateLabel,
        time: getSelectedTimeRangeLabel()
    };
}

function getOwnerLabel() {
    const studentName = getCurrentStudentName();

    const baseLabel = studentName || "Unknown";

    if (anonCheck && anonCheck.checked) {
        return `${baseLabel} (Anonymous)`;
    }

    return baseLabel;
}

function fillConfirmPopup() {
    if (!confirmPopup) return;

    const details = getReservationDetails();
    const popupContent = confirmPopup.querySelectorAll("p");

    if (popupContent[1]) {
        popupContent[1].textContent = `Laboratory: Lab ${details.lab}`;
    }

    if (popupContent[2]) {
        popupContent[2].textContent = `Computer: Comp ${details.comp}`;
    }

    if (popupContent[3]) {
        popupContent[3].textContent = `Date: ${details.date}`;
    }

    if (popupContent[4]) {
        popupContent[4].textContent = `Time: ${details.time}`;
    }

    if (popupContent[5]) {
        if (isEditReservationPage && originalReservationInfo) {
            const ownerText =
                originalReservationInfo.name ||
                originalReservationInfo.reserved_by ||
                getCurrentStudentName() ||
                "Unknown";

            popupContent[5].textContent =
                `Set under: ${ownerText}${anonCheck && anonCheck.checked ? " (Anonymous)" : ""}`;
        } else {
            popupContent[5].textContent = `Set under: ${getOwnerLabel()}`;
        }
    }
}

function hasReservationSelection() {
    if (!currentScheduleDate) return false;
    return getSelectedSlotsForDate(currentScheduleDate).length > 0;
}

function openConfirmPopup() {
    if (!confirmPopup) return;

    if (!hasReservationSelection()) {
        alert("Please select at least one available time slot.");
        return;
    }

    fillConfirmPopup();
    confirmPopup.style.display = "block";
}

function closeConfirmPopup() {
    if (!confirmPopup) return;
    confirmPopup.style.display = "none";
}

async function createReservation() {
    const currentStudentId = getCurrentStudentId();
    const selectedLab = getSelectedLab();
    const selectedComp = getComputerId();
    const startTime = getReservationStartTime();
    const endTime = getReservationEndTime();

    if (!currentScheduleDate || !startTime || !endTime) {
        alert("Please select a valid reservation time.");
        return false;
    }

    const reservationData = {
        user_id: currentStudentId,
        lab_id: Number(selectedLab),
        computer_id: Number(selectedComp),
        date: currentScheduleDate,
        start_time: startTime,
        end_time: endTime,
        is_anonymous: anonCheck ? anonCheck.checked : false
    };

    try {
        const response = await fetch(`${API_BASE}/reservations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(reservationData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to save reservation");
        }

        selectedScheduleSlots[currentScheduleDate] = [];
        closeConfirmPopup();
        await fetchComputerReservations(currentScheduleDate);
        fillSchedulePage();
        updateConfirmDetails();

        alert("Reservation created successfully.");
        return true;
    } catch (error) {
        console.error("Error saving reservation:", error);
        alert(error.message || "Failed to save reservation.");
        return false;
    }
}

async function updateReservation() {
    const startTime = getReservationStartTime();
    const endTime = getReservationEndTime();

    if (!originalReservationInfo || !selectedReservationId || !startTime || !endTime) {
        alert("Missing edited reservation details.");
        return false;
    }

    const currentStudentId = String(getCurrentStudentId() || "");
    const reservationOwnerId = String(originalReservationInfo.user_id || "");

    if (!currentStudentId || !reservationOwnerId || reservationOwnerId !== currentStudentId) {
        alert("You are not allowed to edit this reservation.");
        return false;
    }

    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);

    if (!canEditSelection(currentScheduleDate, selectedIndexes)) {
        alert("Edited reservation must stay on the same date, remain adjacent, and still include at least one original time slot.");
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/reservation/${selectedReservationId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start_time: startTime,
                end_time: endTime,
                is_anonymous: anonCheck ? anonCheck.checked : false
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to update reservation");
        }

        alert("Reservation updated successfully.");
        closeConfirmPopup();

        if (document.referrer) {
            window.history.back();
        } else {
            window.location.href = "/views/shared/reservations_current.html";
        }

        return true;
    } catch (error) {
        console.error("Error updating reservation:", error);
        alert(error.message || "Failed to update reservation.");
        return false;
    }
}

if (confirmBtn) {
    confirmBtn.addEventListener("click", function () {
        if (isEditReservationPage) {
            if (!originalReservationInfo) {
                alert("No reservation selected for editing.");
                return;
            }

            const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);

            if (!canEditSelection(currentScheduleDate, selectedIndexes)) {
                alert("Edited reservation must include at least one original time slot.");
                return;
            }
        }

        openConfirmPopup();
    });
}

if (returnBtn) {
    returnBtn.addEventListener("click", function () {
        if (document.referrer) {
            window.history.back();
        } else {
            window.location.href = "/views/shared/reservations_current.html";
        }
    });
}

if (anonCheck) {
    anonCheck.addEventListener("change", function () {
        if (confirmPopup && confirmPopup.style.display === "block") {
            fillConfirmPopup();
        }
    });
}

if (noBtn) {
    noBtn.addEventListener("click", function () {
        closeConfirmPopup();
    });
}

if (yesBtn) {
    yesBtn.addEventListener("click", async function () {
        yesBtn.disabled = true;

        if (isEditReservationPage) {
            await updateReservation();
        } else {
            await createReservation();
        }

        yesBtn.disabled = false;
    });
}

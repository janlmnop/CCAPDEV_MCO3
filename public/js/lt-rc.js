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
    if (displayHour === 0) displayHour = 12;

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

    for (let m = minimumStartMinutes; m < 20 * 60; m += 30) {
        const option = document.createElement("option");
        option.value = formatTimeValue(m);
        option.textContent = formatTimeLabel(m);
        startTimeSelect.appendChild(option);
    }
}

function populateEndTimes() {
    if (!endTimeSelect || !startTimeSelect) return;

    endTimeSelect.innerHTML = '<option value="">Select end time</option>';

    const selectedStart = startTimeSelect.value;
    if (!selectedStart) return;

    const startMinutes =
        parseInt(selectedStart.slice(0, 2), 10) * 60 +
        parseInt(selectedStart.slice(2, 4), 10);

    for (let m = startMinutes + 30; m <= 20 * 60; m += 30) {
        const option = document.createElement("option");
        option.value = formatTimeValue(m);
        option.textContent = formatTimeLabel(m);
        endTimeSelect.appendChild(option);
    }
}

if (dateSelect && startTimeSelect && endTimeSelect) {
    populateStartTimes();
    dateSelect.addEventListener("change", populateStartTimes);
    startTimeSelect.addEventListener("change", populateEndTimes);
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

function getReservedForStudent() {
    const params = new URLSearchParams(window.location.search);
    return params.get("for_student") || "";
}

function buildLtReservationUrl(page, extraParams = {}) {
    const currentParams = new URLSearchParams(window.location.search);
    const nextParams = new URLSearchParams();

    const forStudent = currentParams.get("for_student");
    if (forStudent) {
        nextParams.set("for_student", forStudent);
    }

    Object.keys(extraParams).forEach(function (key) {
        const value = extraParams[key];
        if (value !== "" && value !== null && value !== undefined) {
            nextParams.set(key, value);
        }
    });

    const queryString = nextParams.toString();
    return queryString ? `${page}?${queryString}` : page;
}

function getSelectedDate(dateValue) {
    const parts = dateValue.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getComputerId() {
    const selectedLab = Number(getSelectedLab());
    const selectedComp = Number(getSelectedComp());

    if (!selectedLab || !selectedComp) {
        return "";
    }

    return ((selectedLab - 1) * 10) + selectedComp;
}

function formatCurrentDisplayDateToDb(dateText) {
    const parsedDate = new Date(dateText);

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCurrentDisplayTimeToDb(timeText) {
    const [timePart, suffix] = timeText.trim().split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (suffix === "PM" && hours !== 12) {
        hours += 12;
    }

    if (suffix === "AM" && hours === 12) {
        hours = 0;
    }

    return `${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}`;
}

async function getStudentNameById(studentId) {
    if (!studentId) return "";

    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`);

        if (!response.ok) {
            throw new Error("Failed to load student name");
        }

        const student = await response.json();
        return student.name || "";
    } catch (error) {
        console.error("Error getting student name:", error);
        return "";
    }
}

function getReservationId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("reservation_id") || "";
}

function getEditReservationUrl() {
    const selectedLab = getSelectedLab();
    const selectedComp = getSelectedComp();

    if (!selectedLab || !selectedComp || !currentScheduleDate || !selectedReservationId) {
        return "";
    }

    return buildLtReservationUrl("lt-vr-cs-ce.html", {
        lab: selectedLab,
        comp: selectedComp,
        reservation_id: selectedReservationId
    });
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

/* ── current date-time display ── */

function updateCurrentDateTime() {
    const curDate = document.getElementById("cur-date");
    const curTime = document.getElementById("cur-time");
    if (!curDate || !curTime) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const labStart = 8 * 60;
    const labEnd = 20 * 60;

    if (currentMinutes < labStart || currentMinutes >= labEnd) {
        curDate.textContent = "Unavailable";
        curTime.textContent = "Unavailable";
        return;
    }

    const startMinutes = getCurrentSlotStart();
    curDate.textContent = formatDateLabel(now);
    curTime.textContent = `${formatTimeLabel(startMinutes)} - ${formatTimeLabel(startMinutes + 30)}`;
}

/* ── lab and computer page navigation ── */

document.addEventListener("DOMContentLoaded", function () {
    const selectedLab = getSelectedLab();
    const selectedComp = getSelectedComp();

    const currentPage = window.location.pathname.split("/").pop();
    const compLinks = document.querySelectorAll("a[data-comp]");
    const labLinks = document.querySelectorAll(".panel-body .lab .lab-title a");

    if (currentPage === "lt-rc-ls.html") {
        labLinks.forEach(function (link, index) {
            link.href = buildLtReservationUrl("lt-rc-cs.html", {
                lab: index + 1
            });
        });
    }

    if (!selectedLab) return;

    if (currentPage === "lt-rc-cs.html") {
        document.title = `Reserve Computer - L${selectedLab} Computer Selection`;

        const panelTitle = document.getElementById("panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer Selection`;
        }

        compLinks.forEach(function (link) {
            link.href = buildLtReservationUrl("lt-rc-cs-c.html", {
                lab: selectedLab,
                comp: link.dataset.comp
            });
        });
    }

    if (currentPage === "lt-rc-cs-c.html") {
        if (!selectedComp) return;

        document.title = `Reserve Computer - L${selectedLab}C${selectedComp} Reservation`;

        const panelTitle = document.getElementById("res-panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer ${selectedComp} Reservation`;
        }

        const compTitle = document.getElementById("comp-title");
        if (compTitle) {
            compTitle.textContent = `Comp ${selectedComp}`;
        }
    }

    if (currentPage === "lt-vr-cs.html") {
        document.title = `View Reservations - L${selectedLab} Computer Selection`;

        const panelTitle = document.getElementById("view-panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer Selection`;
        }

        compLinks.forEach(function (link) {
            link.href = buildLtReservationUrl("lt-vr-cs-c.html", {
                lab: selectedLab,
                comp: link.dataset.comp
            });
        });
    }

    if (currentPage === "lt-vr-cs-c.html") {
        if (!selectedComp) return;

        document.title = `View Reservations - L${selectedLab}C${selectedComp} Reservations`;

        const panelTitle = document.getElementById("view-res-panel-title");
        if (panelTitle) {
            panelTitle.textContent = `Lab ${selectedLab} Computer ${selectedComp} Reservations`;
        }

        const compTitle = document.getElementById("view-comp-title");
        if (compTitle) {
            compTitle.textContent = `Comp ${selectedComp}`;
        }
    }
	
	if (currentPage === "lt-vr-cs-ce.html") {
		if (!selectedComp) return;

		document.title = `Edit Reservation - L${selectedLab}C${selectedComp}`;

		const panelTitle = document.getElementById("res-panel-title");
		if (panelTitle) {
			panelTitle.textContent = `Lab ${selectedLab} Computer ${selectedComp} Reservation`;
		}

		const compTitle = document.getElementById("comp-title");
		if (compTitle) {
			compTitle.textContent = `Comp ${selectedComp}`;
		}
	}
});

/* ── schedule paging ── */

const schedDateSelect = document.getElementById("date-title");
const schedRows = document.querySelectorAll(".sched-table .res-row");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const currentPageName = window.location.pathname.split("/").pop();
const isReservePage = currentPageName === "lt-rc-cs-c.html";
const isViewReservationPage = currentPageName === "lt-vr-cs-c.html";
const isEditReservationPage = currentPageName === "lt-vr-cs-ce.html";

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

    for (let m = 8 * 60; m < 20 * 60; m += 30) {
        slots.push({
            startValue: formatTimeValue(m),
            endValue: formatTimeValue(m + 30),
            label: `${formatTimeLabel(m)} - ${formatTimeLabel(m + 30)}`
        });
    }

    return slots;
}

const allScheduleSlots = generateScheduleSlots();

function getSelectedSlotsForDate(dateValue) {
    if (!dateValue) return [];

    if (!selectedScheduleSlots[dateValue]) {
        selectedScheduleSlots[dateValue] = [];
    }

    return selectedScheduleSlots[dateValue];
}

function isConsecutiveSelection(slotIndexes) {
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

    if (isViewReservationPage && selectedReservationInfo) {
        return `${formatTimeValueToLabel(selectedReservationInfo.start_time)} - ${formatTimeValueToLabel(selectedReservationInfo.end_time)}`;
    }

    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);
    if (!selectedIndexes.length) return "";

    const sorted = [...selectedIndexes].sort(function (a, b) {
        return a - b;
    });

    const firstSlot = allScheduleSlots[sorted[0]];
    const lastSlot = allScheduleSlots[sorted[sorted.length - 1]];

    return `${formatTimeValueToLabel(firstSlot.startValue)} - ${formatTimeValueToLabel(lastSlot.endValue)}`;
}

function getSelectedTimeValues() {
    if (!currentScheduleDate) return null;

    if (isViewReservationPage && selectedReservationInfo) {
        return {
            start_time: selectedReservationInfo.start_time,
            end_time: selectedReservationInfo.end_time
        };
    }

    const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);
    if (!selectedIndexes.length) return null;

    const sorted = [...selectedIndexes].sort(function (a, b) {
        return a - b;
    });

    return {
        start_time: allScheduleSlots[sorted[0]].startValue,
        end_time: allScheduleSlots[sorted[sorted.length - 1]].endValue
    };
}

function getVisibleScheduleSlots() {
    const startIndex = currentSchedulePage * slotsPerPage;
    return allScheduleSlots.slice(startIndex, startIndex + slotsPerPage);
}

function getReservationSlotIndexes(startTime, endTime) {
    const startHour = parseInt(startTime.slice(0, 2), 10);
    const startMinute = parseInt(startTime.slice(2, 4), 10);
    const endHour = parseInt(endTime.slice(0, 2), 10);
    const endMinute = parseInt(endTime.slice(2, 4), 10);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const slotIndexes = [];

    for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 30) {
        const slotIndex = (minutes - (8 * 60)) / 30;

        if (slotIndex >= 0 && slotIndex < allScheduleSlots.length) {
            slotIndexes.push(slotIndex);
        }
    }

    return slotIndexes;
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

    if (!isConsecutiveSelection(sorted)) {
        return false;
    }

    if (!arraysHaveCommonSlot(sorted, originalReservationSlotIndexes)) {
        return false;
    }

    for (const slotIndex of sorted) {
        const reservedInfo = getReservedSlotInfo(dateValue, slotIndex);

        if (
            reservedInfo &&
            (!originalReservationInfo._id || reservedInfo.reservationId !== originalReservationInfo._id)
        ) {
            return false;
        }
    }

    return true;
}

function isReservedScheduleSlot(dateValue, slotIndex) {
    if (!dateValue) return false;
    if (!reservedScheduleSlots[dateValue]) return false;
    return !!reservedScheduleSlots[dateValue][slotIndex];
}

function getReservedSlotInfo(dateValue, slotIndex) {
    if (!dateValue) return null;
    if (!reservedScheduleSlots[dateValue]) return null;
    return reservedScheduleSlots[dateValue][slotIndex] || null;
}

async function fetchComputerReservations(dateValue) {
    reservedScheduleSlots[dateValue] = {};

    const selectedLab = Number(getSelectedLab());
    const selectedComp = Number(getSelectedComp());
    const computerId = Number(getComputerId());

    if (!selectedLab || !selectedComp || !dateValue) {
        return;
    }

    try {
        const query = new URLSearchParams({
            lab_id: selectedLab,
            computer_id: computerId,
            date: dateValue
        });

        const response = await fetch(`${API_BASE}/comps/reservations?${query.toString()}`);
        if (!response.ok) {
            throw new Error("Primary reservation fetch failed");
        }

        const reservations = await response.json();

        reservations.forEach(function (reservation) {
            const slotIndexes = getReservationSlotIndexes(
                reservation.start_time,
                reservation.end_time
            );

            slotIndexes.forEach(function (slotIndex) {
                reservedScheduleSlots[dateValue][slotIndex] = {
                    reservationId: reservation._id || "",
                    userId: reservation.user_id || "",
                    reservedBy: reservation.name || reservation.reserved_by || "Reserved",
                    isAnonymous: reservation.is_anonymous === true,
                    reservation: reservation
                };
            });
        });

        return;
    } catch (error) {
        console.warn("Rich reservation fetch unavailable, falling back to availability:", error);
    }

    try {
        const fallbackResponse = await fetch(
            `${API_BASE}/availability?lab_id=${selectedLab}&computer_no=${selectedComp}&date=${dateValue}`
        );

        if (!fallbackResponse.ok) {
            throw new Error("Fallback availability fetch failed");
        }

        const data = await fallbackResponse.json();
        const takenSlots = Array.isArray(data.takenSlots) ? data.takenSlots : [];

        takenSlots.forEach(function (startTimeValue) {
            const slotIndex = allScheduleSlots.findIndex(function (slot) {
                return slot.startValue === startTimeValue;
            });

            if (slotIndex !== -1) {
                reservedScheduleSlots[dateValue][slotIndex] = {
                    reservationId: "",
                    userId: "",
                    reservedBy: "Reserved",
                    isAnonymous: false,
                    reservation: {
                        start_time: startTimeValue,
                        end_time: allScheduleSlots[slotIndex].endValue,
                        reserved_by: "Reserved"
                    }
                };
            }
        });
    } catch (fallbackError) {
        console.error("Could not fetch reservation availability:", fallbackError);
    }
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

        const reservedInfo = getReservedSlotInfo(currentScheduleDate, slotIndex);
        const selectable = CanSelectSlot(currentScheduleDate, slotIndex);

        if (reservedInfo) {
			const displayName = reservedInfo.reservedBy || "Reserved";

			if (reservedInfo.userId) {
				slotCell.innerHTML = `<a href="/views/other-student/userprofile_student_other.html?student_id=${reservedInfo.userId}">
                ${displayName}</a>`;
			} else {
				slotCell.textContent = displayName;
			}
        } else {
            slotCell.innerHTML = "";
        }

        if (isViewReservationPage) {
            checkbox.disabled = !reservedInfo;

            const isSelectedReservedSlot =
                selectedReservationInfo &&
                reservedInfo &&
                selectedReservationInfo._id &&
                reservedInfo.reservation &&
                reservedInfo.reservation._id === selectedReservationInfo._id;

            checkbox.checked = !!isSelectedReservedSlot;
            return;
        }

        if (isEditReservationPage) {
            const isOriginalReservationSlot =
                reservedInfo &&
                originalReservationInfo &&
                reservedInfo.reservationId === originalReservationInfo._id;

            checkbox.disabled =
                ((!selectable && !isOriginalReservationSlot) || (!!reservedInfo && !isOriginalReservationSlot));

            checkbox.checked = selectedIndexes.includes(slotIndex);
            return;
        }

        checkbox.disabled = !selectable || !!reservedInfo;
        checkbox.checked = selectable && selectedIndexes.includes(slotIndex);
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

    if (confirmDate) {
        confirmDate.textContent = currentScheduleDate
            ? formatDateLabel(getSelectedDate(currentScheduleDate))
            : "";
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

        if (isViewReservationPage) {
            if (!reservedInfo) {
                this.checked = false;
                return;
            }

            selectedScheduleSlots[currentScheduleDate] = [slotIndex];
            selectedReservationId = reservedInfo.reservationId || "";
            selectedReservationInfo = reservedInfo.reservation || null;

            fillSchedulePage();
            updateConfirmDetails();
            return;
        }

        let selectedIndexes = [...getSelectedSlotsForDate(currentScheduleDate)];

        if (isEditReservationPage) {
            const isOriginalReservationSlot =
                reservedInfo &&
                originalReservationInfo &&
                reservedInfo.reservationId === originalReservationInfo._id;

            if (!CanSelectSlot(currentScheduleDate, slotIndex) && !isOriginalReservationSlot) {
                this.checked = false;
                return;
            }

            if (reservedInfo && !isOriginalReservationSlot) {
                this.checked = false;
                return;
            }

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

        if (!CanSelectSlot(currentScheduleDate, slotIndex) || reservedInfo) {
            this.checked = false;
            return;
        }

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

        if (!isConsecutiveSelection(selectedIndexes)) {
            this.checked = !this.checked;
            return;
        }

        selectedScheduleSlots[currentScheduleDate] = selectedIndexes;
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
        if (currentSchedulePage < totalPages - 1) {
            currentSchedulePage++;
            fillSchedulePage();
        }
    });
}

clearScheduleTable();
updateScheduleNavButtons();
updateConfirmDetails();

/* ── slot availability rules ── */

function getDateStatus(dateValue) {
    if (!dateValue) return "";

    const selectedDate = getSelectedDate(dateValue);
    const today = new Date();

    const selectedOnly = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    );

    const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    if (selectedOnly.getTime() > todayOnly.getTime()) return "future";
    if (selectedOnly.getTime() < todayOnly.getTime()) return "past";
    return "today";
}

function CanSelectSlot(dateValue, slotIndex) {
    if (!dateValue || slotIndex < 0 || slotIndex >= allScheduleSlots.length) {
        return false;
    }

    const reservedInfo = getReservedSlotInfo(dateValue, slotIndex);

    if (isEditReservationPage && originalReservationInfo) {
        const isOriginalReservationSlot =
            reservedInfo &&
            reservedInfo.reservationId === originalReservationInfo._id;

        if (isOriginalReservationSlot) {
            return true;
        }
    }

    if (isReservedScheduleSlot(dateValue, slotIndex)) {
        return false;
    }

    const status = getDateStatus(dateValue);

    if (status === "future") return true;
    if (status === "past") return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const slot = allScheduleSlots[slotIndex];

    const slotStart =
        parseInt(slot.startValue.slice(0, 2), 10) * 60 +
        parseInt(slot.startValue.slice(2, 4), 10);

    const slotEnd =
        parseInt(slot.endValue.slice(0, 2), 10) * 60 +
        parseInt(slot.endValue.slice(2, 4), 10);

    if (currentMinutes < slotStart) return true;
    if (currentMinutes >= slotEnd) return false;

    if (isViewReservationPage) {
        return currentMinutes >= slotStart + 10;
    }

    return true;
}

/* ── reserve and delete popup ── */

const confirmBtn = document.getElementById("confirm-btn");
const confirmPopup = document.getElementById("confirm-popup");
const editBtn = document.getElementById("edit-btn");
const returnBtn = document.getElementById("return-btn");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const anonCheck = document.getElementById("anon-check") || document.querySelector(".anon-check");

let reservedStudentName = "";

async function getReservedStudentName() {
    const reservedStudentId = getReservedForStudent();
    return await getStudentNameById(reservedStudentId);
}

function getOwnerLabel() {
    const reservedStudentId = getReservedForStudent();
    const loggedInUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

    let baseLabel = "";

    if (reservedStudentId) {
        if (reservedStudentName) {
            baseLabel = reservedStudentName;
        } else {
            baseLabel = `Student ID: ${reservedStudentId}`;
        }
    } else {
        baseLabel = loggedInUser.name || loggedInUser.name || loggedInUser._id || "Unknown";
    }

    if (anonCheck && anonCheck.checked) {
        return `${baseLabel} (Anonymous)`;
    }

    return baseLabel;
}

function getReservationDetails() {
    return {
        lab: getSelectedLab(),
        comp: getSelectedComp(),
        date: currentScheduleDate ? formatDateLabel(getSelectedDate(currentScheduleDate)) : "",
        time: getSelectedTimeRangeLabel(),
        setUnder: getOwnerLabel()
    };
}

async function fillConfirmPopup() {
    if (!confirmPopup) return;

    const details = getReservationDetails();
    const paragraphs = confirmPopup.querySelectorAll("p");

    if (paragraphs[1]) paragraphs[1].textContent = `Laboratory: Lab ${details.lab}`;
    if (paragraphs[2]) paragraphs[2].textContent = `Computer: Comp ${details.comp}`;
    if (paragraphs[3]) paragraphs[3].textContent = `Date: ${details.date}`;
    if (paragraphs[4]) paragraphs[4].textContent = `Time: ${details.time}`;

    if (isEditReservationPage && originalReservationInfo) {
        let ownerText =
            originalReservationInfo.name ||
            originalReservationInfo.reserved_by ||
            "";

        if (!ownerText && originalReservationInfo.user_id) {
            ownerText = await getStudentNameById(originalReservationInfo.user_id);
        }

        if (!ownerText && originalReservationInfo.user_id) {
            ownerText = `User ID: ${originalReservationInfo.user_id}`;
        }

        if (paragraphs[5]) {
            paragraphs[5].textContent =
                `Set under: ${ownerText}${anonCheck && anonCheck.checked ? " (Anonymous)" : ""}`;
        }

        return;
    }

    if (paragraphs[5]) paragraphs[5].textContent = `Set under: ${details.setUnder}`;
}

function fillDeletePopup() {
    if (!confirmPopup || !selectedReservationInfo) return;

    const paragraphs = confirmPopup.querySelectorAll("p");

    if (paragraphs[1]) paragraphs[1].textContent = `Laboratory: Lab ${getSelectedLab()}`;
    if (paragraphs[2]) paragraphs[2].textContent = `Computer: Comp ${getSelectedComp()}`;
    if (paragraphs[3]) paragraphs[3].textContent = `Date: ${formatDateLabel(getSelectedDate(currentScheduleDate))}`;
    if (paragraphs[4]) {
        paragraphs[4].textContent =
            `Time Slot: ${formatTimeValueToLabel(selectedReservationInfo.start_time)} - ${formatTimeValueToLabel(selectedReservationInfo.end_time)}`;
    }
    if (paragraphs[5]) {
        paragraphs[5].textContent =
            `Set under: ${selectedReservationInfo.name || selectedReservationInfo.reserved_by || "Reserved"}`;
    }
}

function closeConfirmPopup() {
    if (confirmPopup) {
        confirmPopup.style.display = "none";
    }
}

async function openReservePopup() {
    if (!currentScheduleDate) {
        alert("Please select a date first.");
        return;
    }

    if (!getSelectedSlotsForDate(currentScheduleDate).length) {
        alert("Please select at least one available time slot.");
        return;
    }

    const reservedStudentId = getReservedForStudent();
    if (reservedStudentId && !reservedStudentName) {
        reservedStudentName = await getReservedStudentName();
    }

    await fillConfirmPopup();
    if (confirmPopup) {
        confirmPopup.style.display = "block";
    }
}

function openDeletePopup() {
    if (!selectedReservationInfo) {
        alert("Please select a reserved time slot first.");
        return;
    }

    fillDeletePopup();
    if (confirmPopup) {
        confirmPopup.style.display = "block";
    }
}

if (confirmBtn) {
    confirmBtn.addEventListener("click", async function () {
        if (isViewReservationPage) {
            openDeletePopup();
            return;
        }

        if (isReservePage) {
            openReservePopup();
            return;
        }

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

            await fillConfirmPopup();
            if (confirmPopup) {
                confirmPopup.style.display = "block";
            }
        }
    });
}

if (editBtn) {
    editBtn.addEventListener("click", function () {
        if (!selectedReservationInfo || !selectedReservationId || !currentScheduleDate) {
            alert("Please select a reserved time slot first.");
            return;
        }

        const editUrl = getEditReservationUrl();

        if (!editUrl) {
            alert("Could not open edit page.");
            return;
        }

        window.location.href = editUrl;
    });
}

if (returnBtn) {
    returnBtn.addEventListener("click", function () {
        if (document.referrer) {
            window.history.back();
        } else {
            window.location.href = buildLtReservationUrl("lt-vr-cs-c.html", {
                lab: getSelectedLab(),
                comp: getSelectedComp()
            });
        }
    });
}

if (anonCheck) {
    anonCheck.addEventListener("change", async function () {
        if (confirmPopup && confirmPopup.style.display === "block" && (isReservePage || isEditReservationPage)) {
            await fillConfirmPopup();
        }
    });
}

if (noBtn) {
    noBtn.addEventListener("click", closeConfirmPopup);
}

if (yesBtn) {
    yesBtn.addEventListener("click", async function () {
        yesBtn.disabled = true;

        try {
            if (isReservePage) {
                const selectedLab = Number(getSelectedLab());
                const selectedComp = Number(getSelectedComp());
                const computerId = Number(getComputerId());
                const reservedStudentId = getReservedForStudent();
                const loggedInUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
                const timeValues = getSelectedTimeValues();

                if (!selectedLab || !selectedComp || !computerId || !currentScheduleDate || !timeValues) {
                    alert("Missing reservation details.");
                    return;
                }

                const userId = reservedStudentId ? Number(reservedStudentId) : loggedInUser._id;

                const payload = {
                    user_id: userId,
                    lab_id: selectedLab,
                    computer_id: computerId,
                    computer_no: selectedComp,
                    date: currentScheduleDate,
                    start_time: timeValues.start_time,
                    end_time: timeValues.end_time,
                    is_anonymous: anonCheck ? anonCheck.checked : false
                };

                const response = await fetch(`${API_BASE}/reservations`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to create reservation.");
                }

                alert(data.message || "Reservation created successfully.");
                closeConfirmPopup();

                selectedScheduleSlots[currentScheduleDate] = [];
                await loadScheduleForDate(currentScheduleDate);
                return;
            }

            if (isEditReservationPage) {
                const timeValues = getSelectedTimeValues();

                if (!originalReservationInfo || !selectedReservationId || !timeValues) {
                    alert("Missing edited reservation details.");
                    return;
                }

                const selectedIndexes = getSelectedSlotsForDate(currentScheduleDate);

                if (!canEditSelection(currentScheduleDate, selectedIndexes)) {
                    alert("Edited reservation must stay on the same date, remain adjacent, and still include at least one original time slot.");
                    return;
                }

                const updateResponse = await fetch(`${API_BASE}/reservation/${selectedReservationId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        start_time: timeValues.start_time,
                        end_time: timeValues.end_time,
                        is_anonymous: anonCheck ? anonCheck.checked : false
                    })
                });

                const updateData = await updateResponse.json();

                if (!updateResponse.ok) {
                    throw new Error(updateData.message || "Failed to update reservation.");
                }

                alert(updateData.message || "Reservation updated successfully.");
                closeConfirmPopup();

				if (document.referrer) {
				    window.history.back();
				} else {
				    window.location.href = buildLtReservationUrl("lt-vr-cs-c.html", {
				        lab: getSelectedLab(),
				        comp: getSelectedComp()
				    });
				}
				return;
            }

            if (isViewReservationPage) {
                let reservationId = selectedReservationId;

                if (!reservationId && selectedReservationInfo) {
                    try {
                        const selectedLab = getSelectedLab();
                        const selectedComp = getSelectedComp();

                        const findResponse = await fetch(
                            `${API_BASE}/reservation/find?lab_id=${selectedLab}&computer_no=${selectedComp}&date=${currentScheduleDate}&start_time=${selectedReservationInfo.start_time}`
                        );

                        const findData = await findResponse.json();
                        if (findResponse.ok && findData._id) {
                            reservationId = findData._id;
                        }
                    } catch (findError) {
                        console.warn("Fallback reservation find failed:", findError);
                    }
                }

                if (!reservationId) {
                    alert("Could not find that reservation.");
                    return;
                }

                const deleteResponse = await fetch(`${API_BASE}/reservation/${reservationId}`, {
                    method: "DELETE"
                });

                const deleteData = await deleteResponse.json();

                if (!deleteResponse.ok) {
                    throw new Error(deleteData.message || deleteData.error || "Failed to delete reservation.");
                }

                alert(deleteData.message || "Reservation deleted successfully.");
                closeConfirmPopup();

                selectedReservationId = "";
                selectedReservationInfo = null;
                selectedScheduleSlots[currentScheduleDate] = [];
                await loadScheduleForDate(currentScheduleDate);
            }
        } catch (error) {
            console.error(error);
            alert(error.message || "Request failed.");
        } finally {
            yesBtn.disabled = false;
        }
    });
}

/* ── lab availability filtering ── */

const labAvailBtn = document.getElementById("lab-avail-btn") || document.querySelector(".avail-btn.enabled");
const labResetBtn = document.getElementById("lab-reset-btn") || document.querySelector(".avail-btn:not(.enabled)");
const labCards = document.querySelectorAll(".panel-body .lab");
const labLinks = document.querySelectorAll(".panel-body .lab .lab-title a");

function displayLabAvailability(labs) {
    labs.forEach(function (lab) {
        const labAvail = document.querySelector(`.lab-avail[data-lab="${lab.lab_id}"]`);
        const labIndex = lab.lab_id - 1;

        if (labAvail) {
            const available = lab.available_computers ?? lab.available ?? 0;
            const total = lab.total_computers ?? lab.total ?? 10;
            labAvail.textContent = `${available}/${total}`;
        }

        const availableCount = lab.available_computers ?? lab.available ?? 0;

        if (availableCount <= 0) {
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
                labLinks[labIndex].href = buildLtReservationUrl("lt-rc-cs.html", {
                    lab: lab.lab_id
                });
                labLinks[labIndex].style.pointerEvents = "auto";
            }
        }
    });
}

async function checkLabAvailability() {
    const date = dateSelect ? dateSelect.value : "";
    const startTime = startTimeSelect ? startTimeSelect.value : "";
    const endTime = endTimeSelect ? endTimeSelect.value : "";

    if (!date || !startTime || !endTime) {
        alert("Please select a date, start time, and end time first.");
        return;
    }

    try {
        const query = new URLSearchParams({
            date: date,
            start_time: startTime,
            end_time: endTime
        });

        const response = await fetch(`${API_BASE}/labs/availability?${query.toString()}`);
        if (!response.ok) {
            throw new Error("Primary lab availability endpoint failed");
        }

        const labs = await response.json();
        displayLabAvailability(labs);
        return;
    } catch (error) {
        console.warn("Primary lab availability failed, trying fallback:", error);
    }

    try {
        const response = await fetch(
            `${API_BASE}/availability/lab?date=${date}&start_time=${startTime}&end_time=${endTime}`
        );

        if (!response.ok) {
            throw new Error("Fallback lab availability endpoint failed");
        }

        const data = await response.json();

        const normalized = data.map(function (item, index) {
            return {
                lab_id: index + 1,
                available_computers: item.available,
                total_computers: item.total
            };
        });

        displayLabAvailability(normalized);
    } catch (error) {
        console.error("Could not fetch lab availability:", error);
    }
}

function resetLabAvailabilityFilter() {
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
        labLink.href = buildLtReservationUrl("lt-rc-cs.html", {
            lab: index + 1
        });
        labLink.style.pointerEvents = "auto";
    });

    populateStartTimes();
}

if (labAvailBtn) {
    labAvailBtn.addEventListener("click", checkLabAvailability);
}

if (labResetBtn) {
    labResetBtn.addEventListener("click", function (event) {
        event.preventDefault();
        resetLabAvailabilityFilter();
    });
}

/* ── computer availability filtering ── */

const compAvailBtn = document.getElementById("comp-avail-btn");
const compResetBtn = document.getElementById("comp-reset-btn");
const compCards = document.querySelectorAll(".panel-body .comp");
const compLinks = document.querySelectorAll(".panel-body .comp .comp-title a");

function displayComputerAvailability(computers, selectedLab) {
    computers.forEach(function (computer) {
        const compIndex = (computer.comp_no || computer.computer_no) - 1;
        const isAvailable = computer.available !== false && computer.is_available !== false;

        if (!isAvailable) {
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
                compLinks[compIndex].href = buildLtReservationUrl("lt-rc-cs-c.html", {
                    lab: selectedLab,
                    comp: computer.comp_no || computer.computer_no
                });
                compLinks[compIndex].style.pointerEvents = "auto";
            }
        }
    });
}

async function checkComputerAvailability() {
    const selectedLab = getSelectedLab();
    const date = dateSelect ? dateSelect.value : "";
    const startTime = startTimeSelect ? startTimeSelect.value : "";
    const endTime = endTimeSelect ? endTimeSelect.value : "";

    if (!selectedLab || !date || !startTime || !endTime) {
        alert("Please select a date, start time, and end time first.");
        return;
    }

    try {
        const query = new URLSearchParams({
            lab_id: selectedLab,
            date: date,
            start_time: startTime,
            end_time: endTime
        });

        const response = await fetch(`${API_BASE}/comps/availability?${query.toString()}`);
        if (!response.ok) {
            throw new Error("Failed to fetch computer availability");
        }

        const computers = await response.json();
        displayComputerAvailability(computers, selectedLab);
    } catch (error) {
        console.error("Could not fetch computer availability:", error);
    }
}

function resetComputerAvailabilityFilter() {
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
        compLink.href = buildLtReservationUrl("lt-rc-cs-c.html", {
            lab: selectedLab,
            comp: index + 1
        });
        compLink.style.pointerEvents = "auto";
    });

    populateStartTimes();
}

if (compAvailBtn) {
    compAvailBtn.addEventListener("click", checkComputerAvailability);
}

if (compResetBtn) {
    compResetBtn.addEventListener("click", function (event) {
        event.preventDefault();
        resetComputerAvailabilityFilter();
    });
}

/* ── ongoing reservation counters ── */

async function loadOngoingLabReservations() {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage !== "lt-vr-ls.html") return;

    try {
        const curDate = document.getElementById("cur-date");
        const curTime = document.getElementById("cur-time");

        if (!curDate || !curTime) return;

        if (
            curDate.textContent.trim() === "Unavailable" ||
            curTime.textContent.trim() === "Unavailable"
        ) {
            for (let lab = 1; lab <= 5; lab++) {
                const labText = document.getElementById(`lab${lab}-ongoing`);
                if (labText) {
                    labText.textContent = "Unavailable";
                }
            }
            return;
        }

        const dateValue = formatCurrentDisplayDateToDb(curDate.textContent.trim());

        const timeParts = curTime.textContent.split(" - ");
        const startTime = formatCurrentDisplayTimeToDb(timeParts[0]);
        const endTime = formatCurrentDisplayTimeToDb(timeParts[1]);

        const query = new URLSearchParams({
            date: dateValue,
            start_time: startTime,
            end_time: endTime
        });

        const response = await fetch(`${API_BASE}/labs/ongoing?${query.toString()}`);
        if (!response.ok) {
            throw new Error("Failed to fetch ongoing lab reservations");
        }

        const labs = await response.json();

        labs.forEach(function (lab) {
            const labText = document.getElementById(`lab${lab.lab_id}-ongoing`);
            if (labText) {
                labText.textContent = `${lab.reserved_computers} ongoing`;
            }
        });
    } catch (error) {
        console.error("Error loading ongoing lab reservations:", error);
    }
}

async function loadOngoingComputerReservations() {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage !== "lt-vr-cs.html") return;

    try {
        const labId = getSelectedLab();

        const curDate = document.getElementById("cur-date");
        const curTime = document.getElementById("cur-time");
        const ongoingComputers = document.getElementById("ongoing-computers");

        if (!labId || !curDate || !curTime || !ongoingComputers) return;

        if (
            curDate.textContent.trim() === "Unavailable" ||
            curTime.textContent.trim() === "Unavailable"
        ) {
            ongoingComputers.textContent = "Unavailable";
            return;
        }

        const dateValue = formatCurrentDisplayDateToDb(curDate.textContent.trim());

        const timeParts = curTime.textContent.split(" - ");
        const startTime = formatCurrentDisplayTimeToDb(timeParts[0]);
        const endTime = formatCurrentDisplayTimeToDb(timeParts[1]);

        const query = new URLSearchParams({
            lab_id: labId,
            date: dateValue,
            start_time: startTime,
            end_time: endTime
        });

        const response = await fetch(`${API_BASE}/comps/ongoing?${query.toString()}`);
        if (!response.ok) {
            throw new Error("Failed to fetch ongoing computer reservations");
        }

        const data = await response.json();

        if (!data.reserved_computers || data.reserved_computers.length === 0) {
            ongoingComputers.textContent = "None";
        } else {
            ongoingComputers.textContent = data.reserved_computers.join(", ");
        }
    } catch (error) {
        console.error("Error loading ongoing computer reservations:", error);
    }
}

/* ── page refresh ── */

document.addEventListener("DOMContentLoaded", function () {
    updateCurrentDateTime();
    loadOngoingLabReservations();
    loadOngoingComputerReservations();

    setInterval(function () {
        updateCurrentDateTime();
        loadOngoingLabReservations();
        loadOngoingComputerReservations();
    }, 60000);
});

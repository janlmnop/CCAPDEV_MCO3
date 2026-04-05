/**
 * install package dependencies
 * - npm install express
 * - npm install mongoose
 * - npm install bcrypt
 * - npm install dotenv
 **/
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// hashing
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

// get .env file contents
require("dotenv").config();

// ── DATABASE CONNECTION ──
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("MongoDB connected");
    console.log("DB name:", mongoose.connection.name);
    completePastReservations();
    setInterval(() => {
        completePastReservations();
    }, 10 * 60 * 1000);
})
.catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
});

// ── MODELS ──
const Student     = require('./database/models/Student');
const LabTech     = require('./database/models/LabTech');
const Lab         = require('./database/models/Lab');
const Computer    = require('./database/models/Computer');
const Reservation = require('./database/models/Reservation');

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════

// generate 30-min slot strings between start_time and end_time
// e.g. "0800" to "0930"  =>  ["0800", "0830", "0900"]
function generateSlots(start, end) {
    const slots = [];
    let h = parseInt(start.slice(0, 2), 10);
    let m = parseInt(start.slice(2, 4), 10);
    const endH = parseInt(end.slice(0, 2), 10);
    const endM = parseInt(end.slice(2, 4), 10);

    while (h * 60 + m < endH * 60 + endM) {
        slots.push(`${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`);
        m += 30;
        if (m >= 60) { h++; m -= 60; }
    }
    return slots;
}

// check if two time ranges overlap
function timesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}

// paths
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));            // serves public/ folder
app.use('/views', express.static(path.join(__dirname, 'views')));   // serves views/ folder

// landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'shared', 'WelcomePage.html'));
});

// ════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════
// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: "ID and password are required." });

    const isNumeric = !isNaN(username) && username.trim() !== '';
    if (!isNumeric)
        return res.status(401).json({ message: "Invalid credentials." });

    try {
        // Try students first
        let user = await Student
            .findOne({ _id: Number(username) })
            .select("+password");

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(401).json({ message: "Invalid ID or password." });

            return res.json({
                success: true,
                type: "student",
                user: {
                    _id:          user._id,
                    name:         user.name,
                    email_add:    user.email_add,
                    college_code: user.college_code,
                    course_code:  user.course_code,
                    profile_img:  user.profile_img
                }
            });
        }

        // Try labtech
        let labtech = await LabTech
            .findOne({ _id: Number(username) })
            .select("+password");

        if (labtech) {
            const isMatch = await bcrypt.compare(password, labtech.password);
            if (!isMatch)
                return res.status(401).json({ message: "Invalid ID or password." });

            return res.json({
                success: true,
                type: "labtech",
                user: {
                    _id:         labtech._id,
                    name:        labtech.name,
                    email_add:   labtech.email_add,
                    job_title:   labtech.job_title,
                    profile_img: labtech.profile_img
                }
            });
        }

        return res.status(401).json({ message: "Invalid credentials." });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST /api/auth/register/student
app.post("/api/auth/register/student", async (req, res) => {
    console.log("Register body received:", req.body);
    const { studentId, email, password, confirmPassword } = req.body;

    if (!studentId || !email || !password || !confirmPassword)
        return res.status(400).json({ message: "All fields are required." });

    if (password !== confirmPassword)
        return res.status(400).json({ message: "Passwords do not match." });

    try {
        const existingId = await Student.findById(Number(studentId));
        if (existingId)
            return res.status(409).json({ message: "That student ID already has an account." });

        const existingEmail = await Student.findOne({ email_add: email });
        if (existingEmail)
            return res.status(409).json({ message: "That email is already registered." });

        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        const hashedPassword = await bcrypt.hash(password, salt);

        const student = new Student({
            _id:          Number(studentId),
            name:         "",
            email_add:    email,
            college_code: "",
            course_code:  "",
            bio:          "",
            profile_img:  "user_picture.png",
            password:     hashedPassword
        });

        await student.save();

        res.status(201).json({
            success: true,
            message: "Student registered successfully!",
            student: { _id: student._id }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST /api/auth/register/labtech
app.post("/api/auth/register/labtech", async (req, res) => {
    console.log("Labtech register body received:", req.body);
    const { employeeId, email, password, confirmPassword } = req.body;

    if (!employeeId || !email || !password || !confirmPassword)
        return res.status(400).json({ message: "All fields are required." });

    if (password !== confirmPassword)
        return res.status(400).json({ message: "Passwords do not match." });

    try {
        const existingId = await LabTech.findById(Number(employeeId));
        if (existingId)
            return res.status(409).json({ message: "That employee ID already has an account." });

        const existingEmail = await LabTech.findOne({ email_add: email });
        if (existingEmail)
            return res.status(409).json({ message: "That email is already registered." });

        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
        const hashedPassword = await bcrypt.hash(password, salt);

        const labtech = new LabTech({
            _id:         Number(employeeId),
            name:        "",
            email_add:   email,
            job_title:   "Lab Technician",
            bio:         "",
            profile_img: "user_picture.png",
            password:    hashedPassword
        });

        await labtech.save();

        res.status(201).json({
            success: true,
            message: "Lab Tech registered successfully!",
            labTech: { _id: labtech._id }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ════════════════════════════════════════
//  STUDENT ROUTES
// ════════════════════════════════════════

// GET students by name search
// NOTE: must be defined BEFORE /api/students/:id to avoid route conflict
// GET /api/students/search?name=hornet
app.get("/api/students/search", async (req, res) => {
    const { name } = req.query;
    if (!name || name.trim() === "")
        return res.status(400).json({ message: "Name query is required." });

    try {
        const students = await Student.find({
            name: { $regex: name.trim(), $options: "i" }
        }).select("-password");

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET student profile
// GET /api/students/:id
app.get("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findById(Number(req.params.id));
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE student
// PUT /api/students/:id
app.put("/api/students/:id", async (req, res) => {
    try {
        if (req.body.password) {
            const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const updated = await Student.findOneAndUpdate(
            { _id: Number(req.params.id) },
            { $set: req.body },
            { returnDocument: "after", runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: "Student not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE student
// DELETE /api/students/:id
app.delete("/api/students/:id", async (req, res) => {
    try {
        const deleted = await Student.findByIdAndDelete(Number(req.params.id));
        if (!deleted) return res.status(404).json({ message: "Student not found" });
        res.json({ message: "Student account deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ════════════════════════════════════════
//  LAB TECH ROUTES
// ════════════════════════════════════════

// GET lab tech profile
// GET /api/labtech/:id
app.get("/api/labtech/:id", async (req, res) => {
    try {
        const labtech = await LabTech.findById(Number(req.params.id));
        if (!labtech) return res.status(404).json({ message: "Lab Tech not found" });
        res.json(labtech);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE lab tech
// PUT /api/labtech/:id
app.put("/api/labtech/:id", async (req, res) => {
    try {
        if (req.body.password) {
            const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const updated = await LabTech.findOneAndUpdate(
            { _id: Number(req.params.id) },
            { $set: req.body },
            { returnDocument: "after", runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: "Lab Tech not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE lab tech
// DELETE /api/labtech/:id
app.delete("/api/labtech/:id", async (req, res) => {
    try {
        const deleted = await LabTech.findByIdAndDelete(Number(req.params.id));
        if (!deleted) return res.status(404).json({ message: "Lab Tech not found" });
        res.json({ message: "Lab Tech account deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ════════════════════════════════════════
//  RESERVATIONS ROUTES
// ════════════════════════════════════════

// GET availability/lab must be before /availability to avoid route conflict
// GET available computer counts per lab for a given date + time range
// used by the left panel in lt-rc-ls.html and s-rc-ls.html
// GET /api/availability/lab?date=2026-03-21&start_time=0800&end_time=0930
app.get("/api/availability/lab", async (req, res) => {
    const { date, start_time, end_time } = req.query;

    if (!date || !start_time || !end_time)
        return res.status(400).json({ message: "date, start_time, and end_time are required." });

    try {
        const labs   = await Lab.find();
        const result = [];

        for (const lab of labs) {
            const computers      = await Computer.find({ lab_id: lab._id });
            const totalComputers = computers.length;

            const conflicting = await Reservation.find({
                lab_id: lab._id,
                date:   date,
                status: "active"
            });

            const takenComputerIds = new Set();
            conflicting.forEach(r => {
                if (timesOverlap(start_time, end_time, r.start_time, r.end_time)) {
                    takenComputerIds.add(r.computer_id);
                }
            });

            result.push({
                lab_id:    lab._id,
                lab_name:  lab.room_name,
                total:     totalComputers,
                taken:     takenComputerIds.size,
                available: totalComputers - takenComputerIds.size
            });
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET taken slots for a specific computer on a specific date
// used by rc.js to disable already-booked slots in the schedule table
// GET /api/availability?lab_id=1&computer_no=2&date=2026-03-21
app.get("/api/availability", async (req, res) => {
    const { lab_id, computer_no, date } = req.query;

    if (!lab_id || !computer_no || !date)
        return res.status(400).json({ message: "lab_id, computer_no, and date are required." });

    try {
        const computer = await Computer.findOne({
            lab_id:      Number(lab_id),
            computer_no: Number(computer_no)
        });

        if (!computer)
            return res.status(404).json({ message: "Computer not found." });

        const reservations = await Reservation.find({
            computer_id: computer._id,
            date:        date,
            status:      "active"
        });

        // collect all taken slot strings
        const takenSlots = [];
        reservations.forEach(r => {
            generateSlots(r.start_time, r.end_time).forEach(slot => {
                if (!takenSlots.includes(slot)) takenSlots.push(slot);
            });
        });

        res.json({ takenSlots });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all reservations for a user
// enriched with lab name, computer number, and slots array
// GET /api/reservations/:userId
app.get("/api/reservations/:userId", async (req, res) => {
    try {
        const reservations = await Reservation.find({ user_id: Number(req.params.userId) });

        const enriched = await Promise.all(reservations.map(async (r) => {
            const lab      = await Lab.findById(r.lab_id);
            const computer = await Computer.findById(r.computer_id);
            return {
                ...r.toObject(),
                lab_name:    lab      ? lab.room_name        : "Unknown",
                computer_no: computer ? computer.computer_no : "?",
                // slots array expected by reservations_current/past.html
                slots: generateSlots(r.start_time, r.end_time)
            };
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single reservation
// GET /api/reservation/:id
app.get("/api/reservation/:id", async (req, res) => {
    try {
        const r = await Reservation.findById(Number(req.params.id));
        if (!r) return res.status(404).json({ message: "Reservation not found" });
        res.json(r);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE reservation time range and/or anonymity
// PUT /api/reservation/:id
app.put("/api/reservation/:id", async (req, res) => {
    try {
        const reservationId = Number(req.params.id);
        const { start_time, end_time, is_anonymous } = req.body;

        if (!start_time || !end_time) {
            return res.status(400).json({
                message: "start_time and end_time are required"
            });
        }

        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        if (reservation.status !== "active") {
            return res.status(400).json({
                message: "Only active reservations can be edited"
            });
        }

        if (start_time >= end_time) {
            return res.status(400).json({
                message: "Invalid reservation time range"
            });
        }

        const overlappingReservation = await Reservation.findOne({
            _id: { $ne: reservationId },
            lab_id: reservation.lab_id,
            computer_id: reservation.computer_id,
            date: reservation.date,
            status: "active",
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        });

        if (overlappingReservation) {
            return res.status(409).json({
                message: "Selected edited time range overlaps with another reservation"
            });
        }

        const updated = await Reservation.findOneAndUpdate(
            { _id: reservationId },
            {
                $set: {
                    start_time: start_time,
                    end_time: end_time,
                    is_anonymous: is_anonymous === true,
                    updated_at: new Date().toISOString()
                }
            },
            { returnDocument: "after", runValidators: true }
        );

        res.json({
            message: "Reservation updated successfully",
            reservation: updated
        });
    } catch (error) {
        console.error("Error updating reservation:", error);
        res.status(500).json({
            message: "Server error while updating reservation"
        });
    }
});

// FIND a reservation by lab_id + computer_no + date + start_time
// used by lt-vr rc.js to get the reservation _id before deleting it
// GET /api/reservation/find?lab_id=1&computer_no=2&date=2026-03-21&start_time=0800
app.get("/api/reservation/find", async (req, res) => {
    const { lab_id, computer_no, date, start_time } = req.query;

    if (!lab_id || !computer_no || !date || !start_time)
        return res.status(400).json({ message: "lab_id, computer_no, date, and start_time are required." });

    try {
        const computer = await Computer.findOne({
            lab_id:      Number(lab_id),
            computer_no: Number(computer_no)
        });

        if (!computer)
            return res.status(404).json({ message: "Computer not found." });

        // find active reservation whose time range contains the given start_time slot
        const reservations = await Reservation.find({
            computer_id: computer._id,
            date:        date,
            status:      "active"
        });

        const match = reservations.find(r =>
            r.start_time <= start_time && start_time < r.end_time
        );

        if (!match)
            return res.status(404).json({ message: "No reservation found for that slot." });

        res.json(match);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE reservation
// DELETE /api/reservation/:id
app.delete("/api/reservation/:id", async (req, res) => {
    try {
        const deleted = await Reservation.findOneAndUpdate(
			{ _id: Number(req.params.id) },
            {	$set: {
                    status: "deleted",
                    updated_at: new Date().toISOString()
				}
            },
            { returnDocument: "after", runValidators: true }
        );

        if (!deleted) return res.status(404).json({ message: "Reservation not found" });

        res.json({ message: "Reservation deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════
//  RESERVATION AVAILABILITY ROUTES
// ════════════════════════════════════════

//mark past reservations as completed
async function completePastReservations() {
    try {
        const now = new Date();

        const currentDate =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(now.getDate()).padStart(2, "0");

        const currentTime =
            String(now.getHours()).padStart(2, "0") +
            String(now.getMinutes()).padStart(2, "0");

        const result = await Reservation.updateMany(
            {
                status: "active",
                $or: [
                    { date: { $lt: currentDate } },
                    {
                        date: currentDate,
                        end_time: { $lte: currentTime }
                    }
                ]
            },
            {
                $set: {
                    status: "completed",
                    updated_at: now.toISOString()
                }
            }
        );

        console.log(`${result.modifiedCount || 0} past reservations marked as completed.`);
    } catch (error) {
        console.error("Error completing past reservations:", error);
    }
}

// GET lab availability for a specific date and time range
app.get("/api/labs/availability", async (req, res) => {
    try {
        const { date, start_time, end_time } = req.query;
		
		// get all overlapping reservations
        const reservations = await Reservation.find({
            date: date,
            status: "active",
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        });

        const labCounts = {
            1: 10,
            2: 10,
            3: 10,
            4: 10,
            5: 10
        };
		
		// compute lab id from comp id
		// subtract reserved comps from total available per lab
        for (let compId = 1; compId <= 50; compId++) {
            const hasReservation = reservations.some(function (reservation) {
                return reservation.computer_id === compId;
            });

            if (hasReservation) {
                const labId = Math.ceil(compId / 10);
                labCounts[labId]--;
            }
        }

        const result = [];
		
		// get total counts per lab
        for (let lab = 1; lab <= 5; lab++) {
            result[lab - 1] = {
                lab_id: lab,
                total_computers: 10,
                available_computers: labCounts[lab],
                available: labCounts[lab] > 0
            };
        }

        res.json(result);
    } catch (error) {
        console.error("Error checking lab availability:", error);
        res.status(500).json({
            message: "Server error while checking lab availability"
        });
    }
});

// GET comp availability for a specific date and time range
app.get("/api/comps/availability", async (req, res) => {
    try {
        const { lab_id, date, start_time, end_time } = req.query;
		
		// get all overlapping reservations
        const reservations = await Reservation.find({
            lab_id: Number(lab_id),
            date: date,
            status: "active",
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        });

        const result = [];
		
		// check each comp in lab if avail
        for (let comp = 1; comp <= 10; comp++) {
            const computerId = (Number(lab_id) - 1) * 10 + comp;

            const hasReservation = reservations.some(function (reservation) {
                return reservation.computer_id === computerId;
            });

            result[comp - 1] = {
                comp_no: comp,
                computer_id: computerId,
                available: !hasReservation
            };
        }

        res.json(result);
    } catch (error) {
        console.error("Error checking computer availability:", error);
        res.status(500).json({
            message: "Server error while checking computer availability"
        });
    }
});

// GET reservations for a specific computer on a specific date
app.get("/api/comps/reservations", async (req, res) => {
    try {
        const { lab_id, computer_id, date } = req.query;
		
		// get all applicable reservations
        const reservations = await Reservation.find({
            lab_id: Number(lab_id),
            computer_id: Number(computer_id),
            date: date,
            status: "active"
        }).sort({ start_time: 1 });
		
		// get user id of each reservation
        const userIds = reservations.map(function (reservation) {
            return reservation.user_id;
        });

        const students = await Student.find({
            _id: { $in: userIds }
        });

        const studentMap = {};

        students.forEach(function (student) {
            studentMap[student._id] = student;
        });
		
		// check if reservation is anonymous
        const result = reservations.map(function (reservation) {
            let reservedBy = "Reserved";

            if (reservation.is_anonymous === true) {
                reservedBy = "Anonymous";
            } else {
                const student = studentMap[reservation.user_id];

                if (student && student.email_add) {
                    reservedBy = student.email_add;
                }
            }

            return {
                _id: reservation._id,
                user_id: reservation.user_id,
                lab_id: reservation.lab_id,
                computer_id: reservation.computer_id,
                date: reservation.date,
                start_time: reservation.start_time,
                end_time: reservation.end_time,
                is_anonymous: reservation.is_anonymous === true,
                status: reservation.status,
                reserved_by: reservedBy
            };
        });

        res.json(result);
    } catch (error) {
        console.error("Error getting computer reservations:", error);
        res.status(500).json({
            message: "Server error while getting computer reservations"
        });
    }
});

// ════════════════════════════════════════
//  CREATE RESERVATION ROUTES
// ════════════════════════════════════════

// POST create reservation
app.post("/api/reservations", async (req, res) => {
    try {
        const {
            user_id,
            lab_id,
            computer_id,
            date,
            start_time,
            end_time,
            is_anonymous
        } = req.body;

        // check for missing input
        if (!user_id || !lab_id || !computer_id || !date || !start_time || !end_time) {
            return res.status(400).json({
                message: "Missing required reservation fields"
            });
        }

        const parsedUserId = Number(user_id);
        const parsedLabId = Number(lab_id);
        const parsedComputerId = Number(computer_id);

        // check for invalid numeric fields
        if (
            !Number.isInteger(parsedUserId) ||
            !Number.isInteger(parsedLabId) ||
            !Number.isInteger(parsedComputerId)
        ) {
            return res.status(400).json({
                message: "Invalid reservation identifiers"
            });
        }

        // check if user exists
        const studentExists = await Student.findById(parsedUserId);

        if (!studentExists) {
            return res.status(404).json({
                message: "Student account does not exist"
            });
        }

        // check if lab exists
        const labExists = await Lab.findById(parsedLabId);

        if (!labExists) {
            return res.status(404).json({
                message: "Selected laboratory does not exist"
            });
        }

        // check if computer exists
        const computerExists = await Computer.findById(parsedComputerId);

        if (!computerExists) {
            return res.status(404).json({
                message: "Selected computer does not exist"
            });
        }

        // check if computer belongs to selected lab
        if (Number(computerExists.lab_id) !== parsedLabId) {
            return res.status(400).json({
                message: "Selected computer does not belong to the selected laboratory"
            });
        }

        // in case of trying to reserve the same slot as smn almost at the same time
        const overlappingReservation = await Reservation.findOne({
            lab_id: parsedLabId,
            computer_id: parsedComputerId,
            date: date,
            status: "active",
            start_time: { $lt: end_time },
            end_time: { $gt: start_time }
        });

        if (overlappingReservation) {
            return res.status(409).json({
                message: "Selected slot is already reserved"
            });
        }

        // increment id
        const latestReservation = await Reservation.findOne().sort({ _id: -1 });
        let nextId = 1;

        if (latestReservation && latestReservation._id) {
            nextId = latestReservation._id + 1;
        }

        const now = new Date().toISOString();

        // create and save reservation
        const newReservation = new Reservation({
            _id: nextId,
            user_id: parsedUserId,
            lab_id: parsedLabId,
            computer_id: parsedComputerId,
            date: date,
            start_time: start_time,
            end_time: end_time,
            is_anonymous: is_anonymous === true,
            status: "active",
            created_at: now,
            updated_at: now
        });

        await newReservation.save();

        res.status(201).json({
            message: "Reservation created successfully",
            reservation: newReservation
        });
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({
            message: "Server error while creating reservation"
        });
    }
});
// ════════════════════════════════════════
//  SERVER
// ════════════════════════════════════════
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running at http://localhost:3000");
});

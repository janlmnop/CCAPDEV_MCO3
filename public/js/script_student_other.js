const API_BASE = "http://localhost:3000/api";

// get student_id from URL query param
// e.g. userprofile_student_other.html?student_id=12300001
const params    = new URLSearchParams(window.location.search);
const studentId = parseInt(params.get("student_id"), 10);

if (!studentId) {
    alert("No student ID provided.");
    history.back();
}

const profilePic = document.getElementById("profile-pic");

// load profile — read only, no edit/delete
async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/students/${studentId}`);
        if (!res.ok) throw new Error("Student not found");
        const data = await res.json();

        document.getElementById("view-name").innerText    = data.name         || "-";
        document.getElementById("view-id").innerText      = data._id;
        document.getElementById("view-email").innerText   = data.email_add    || "-";
        document.getElementById("view-college").innerText = data.college_code || "-";
        document.getElementById("view-course").innerText  = data.course_code  || "-";
        document.getElementById("view-bio").innerText     = data.bio          || "-";

        profilePic.src = `/images/${data.profile_img || "default.jpeg"}`;
    } catch (err) {
        console.error(err);
        alert("Could not load student profile.");
    }
}

window.onload = loadProfile;

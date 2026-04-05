const API_BASE = "/api";

const params = new URLSearchParams(window.location.search);
const studentId = params.get("student_id");

if (!studentId) {
    alert("No student ID provided.");
    history.back();
}

const profilePic = document.getElementById("profile-pic");

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
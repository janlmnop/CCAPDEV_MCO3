const API_URL = "http://localhost:3000/api/students";
const currentStudent = JSON.parse(localStorage.getItem("user") || "{}");      // NOTE : this should depend on the login

// elements
const profilePic = document.getElementById("profile-pic");
const popupEdit = document.querySelector('.up-editbtn');
const popupDelete = document.querySelector('.up-deletebtn');
const containerEdit = document.querySelector('.up-popup-container-edit');
const containerDelete = document.querySelector('.up-popup-container-delete');
const backEdit = document.querySelector('.backbtn-edit');
const backDelete = document.querySelector('.backbtn-delete');
const submitEdit = document.querySelector('.submitbtn-edit');
const submitDelete = document.querySelector('.submitbtn-delete');

// load profile
async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/${currentStudent._id}`);
        if (!res.ok) throw new Error("Student not found");
        const data = await res.json();

        document.getElementById("view-name").innerText = data.name;
        document.getElementById("view-id").innerText = data._id;
        document.getElementById("view-email").innerText = data.email_add;
        document.getElementById("view-college").innerText = data.college_code;
        document.getElementById("view-course").innerText = data.course_code;
        document.getElementById("view-bio").innerText = data.bio;

        document.getElementById("edit-name").value = data.name;
        document.getElementById("edit-email").value = data.email_add;
        document.getElementById("edit-college").value = data.college_code;
        document.getElementById("edit-course").value = data.course_code;
        document.getElementById("edit-bio").value = data.bio;
        document.getElementById("edit-profile-img").value = data.profile_img || "default.jpeg";

        profilePic.src = `/images/${data.profile_img || "default.jpeg"}`;
    } catch (err) {
        console.error(err);
        alert("Could not load profile.");
    }
}

// popup open/close
popupEdit.onclick = () => containerEdit.classList.add('active');
popupDelete.onclick = () => containerDelete.classList.add('active');
backEdit.onclick = () => containerEdit.classList.remove('active');
backDelete.onclick = () => containerDelete.classList.remove('active');

// edit profile
submitEdit.onclick = async () => {
    const updated = {
        name: document.getElementById("edit-name").value,
        email_add: document.getElementById("edit-email").value,
        college_code: document.getElementById("edit-college").value,
        course_code: document.getElementById("edit-course").value,
        bio: document.getElementById("edit-bio").value,
        profile_img: document.getElementById("edit-profile-img").value
    };

    try {
        const res = await fetch(`${API_URL}/${currentStudent._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
        });
        if (!res.ok) throw new Error("Update failed");
        await res.json();
        containerEdit.classList.remove('active');
        loadProfile();
        alert("Profile updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update profile.");
    }
};

// delete account
submitDelete.onclick = async () => {
    try {
        const res = await fetch(`${API_URL}/${currentStudent._id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        alert("Account deleted successfully!");
        containerDelete.classList.remove('active');
        window.location.href = "/views/shared/login.html";
    } catch (err) {
        console.error(err);
        alert("Failed to delete account.");
    }
};

window.onload = loadProfile;
const API_URL = "/api/students";
const currentStudent = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") ||"{}");   

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

        profilePic.src = `/images/${data.profile_img || "user_picture.png"}`;
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
    let newProfileImg = null;

    const fileInput = document.getElementById("edit-profile-img");
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append("image", fileInput.files[0]);

        try {
            const uploadRes = await fetch(`/api/upload/student/${currentStudent._id}`, {
                method: "POST",
                body: formData
            });
            if (!uploadRes.ok) throw new Error("Upload failed");
            const uploadData = await uploadRes.json();
            newProfileImg = uploadData.profile_img;
            document.getElementById("upload-status").innerText = "Photo uploaded!";
        } catch (err) {
            alert("Photo upload failed. Other changes will still save.");
        }
    }

    const updated = {
        name: document.getElementById("edit-name").value,
        email_add: document.getElementById("edit-email").value,
        college_code: document.getElementById("edit-college").value,
        course_code: document.getElementById("edit-course").value,
        bio: document.getElementById("edit-bio").value,
    };

    if (newProfileImg) updated.profile_img = newProfileImg;

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

// delete account — cascade deletes all reservations on the server side
submitDelete.onclick = async () => {
    // Disable the button to prevent double-clicks
    submitDelete.disabled = true;
    submitDelete.textContent = "Deleting...";

    try {
        const res = await fetch(`${API_URL}/${currentStudent._id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Delete failed");

        // Clear all stored session/local data
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userType");

        // Redirect to login
        window.location.href = "/views/shared/login.html";
    } catch (err) {
        console.error(err);
        alert("Failed to delete account. Please try again.");
        submitDelete.disabled = false;
        submitDelete.textContent = "Yes, delete my account!";
    }
};

window.onload = loadProfile;

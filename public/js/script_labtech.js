const API_URL = "http://localhost:3000/api/labtech";
const currentLabTech = JSON.parse(localStorage.getItem("user") || "{}");

const profilePic = document.getElementById("profile-pic");

// popup elements
const popupEdit = document.querySelector(".up-editbtn");
const containerEdit = document.querySelector(".up-popup-container-edit");
const backEdit = document.querySelector(".backbtn-edit");
const submitEdit = document.querySelector(".submitbtn-edit");

const popupDelete = document.querySelector(".up-deletebtn");
const containerDelete = document.querySelector(".up-popup-container-delete");
const backDelete = document.querySelector(".backbtn-delete");

// load profile
async function loadProfile() {
    try {
        const res = await fetch(`${API_URL}/${currentLabTech._id}`);
        if (!res.ok) throw new Error("Lab Tech not found");
        const data = await res.json();

        document.getElementById("view-name").innerText = data.name;
        document.getElementById("view-id").innerText = data._id;
        document.getElementById("view-email").innerText = data.email_add;
        document.getElementById("view-job").innerText = data.job_title;
        document.getElementById("view-bio").innerText = data.bio;
        profilePic.src = `/images/${data.profile_img || "Jane.jpg"}`;

        // Prefill edit form
        document.getElementById("edit-name").value = data.name;
        document.getElementById("edit-email").value = data.email_add;
        document.getElementById("edit-job").value = data.job_title;
        document.getElementById("edit-bio").value = data.bio;
        document.getElementById("edit-profile-img").value = data.profile_img || "Jane.jpg";

    } catch (err) {
        console.error(err);
        alert("Could not load Lab Tech profile.");
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
        job_title: document.getElementById("edit-job").value,
        bio: document.getElementById("edit-bio").value,
        profile_img: document.getElementById("edit-profile-img").value
    };

    try {
        const res = await fetch(`${API_URL}/${currentLabTech._id}`, {
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

window.onload = loadProfile;
const mongoose = require("mongoose");

const labtechSchema = new mongoose.Schema({
    _id: Number,
    name: { type: String },
    email_add: String,
    job_title: String,
    bio: String,
    profile_img: String,
    password: { type: String, select: false, required: true }
});

module.exports = mongoose.model('LabTech', labtechSchema, 'labtech');
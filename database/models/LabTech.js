const mongoose = require("mongoose");

const labtechSchema = new mongoose.Schema({
    _id: Number,
    name: { type: String },
    email_add: String,
    job_title: String,
    bio: String,
    profile_img: String,
    password: { type: String, select: false }
});

const LabTech     = mongoose.model("LabTech",     labtechSchema,     "labtech");

module.exports = LabTech;
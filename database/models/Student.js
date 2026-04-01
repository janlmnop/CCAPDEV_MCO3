const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    _id: Number,
    name: { type: String },
    email_add: String,
    college_code: String,
    course_code: String,
    bio: String,
    profile_img: String,
    password: { type: String, select: false }
});

const Student     = mongoose.model("Student",     studentSchema,     "students");

module.exports = Student;
const mongoose = require("mongoose");

const labSchema = new mongoose.Schema({
    _id: Number,
    room_name: String,
    open_time: String,
    close_time: String
});

const Lab         = mongoose.model("Lab",         labSchema,         "labs");

module.exports = Lab;
const mongoose = require("mongoose");

const computerSchema = new mongoose.Schema({
    _id: Number,
    lab_id: Number,
    computer_no: Number
});

const Computer    = mongoose.model("Computer",    computerSchema,    "computers");

module.exports = Computer;
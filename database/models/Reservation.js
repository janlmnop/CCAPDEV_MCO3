const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
    _id: Number,
    user_id: Number,
    lab_id: Number,
    computer_id: Number,
    date: String,
    start_time: String,
    end_time: String,
    is_anonymous: Boolean,
    status: String,
    created_at: String,
    updated_at: String
});

const Reservation = mongoose.model("Reservation", reservationSchema, "reservations");

module.exports = Reservation;
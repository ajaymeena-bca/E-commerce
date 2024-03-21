import mongoose from "mongoose";
const Schema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: [true, "Please enter a coupon code"],
    },
    amount: {
        type: Number,
        required: [true, "Please enter a amount of coupon code"]
    }
});
export const Coupon = mongoose.model('Coupon', Schema);

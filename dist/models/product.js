import mongoose from "mongoose";
const schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "please enter name"],
    },
    photo: {
        type: String,
        required: [true, "please enter photo"]
    },
    price: {
        type: Number,
        required: [true, "please enter Price"]
    },
    stock: {
        type: Number,
        required: [true, "please enter Stock"]
    },
    category: {
        type: String,
        required: [true, "please enter Category"],
        trim: true,
    },
}, {
    timestamps: true,
});
export const Product = mongoose.model('Product', schema);

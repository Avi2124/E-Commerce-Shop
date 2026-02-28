import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    shopkeeper: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true},
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true, min: 0},
    stock: {type: Number, required: true, min: 0, default: 0},
    isActive: {type: Boolean, default: true},
    isDelete: {type: Boolean, default: false},
    imageUrl: {type: String, required: true}
}, {timestamps: true});

export const Product = mongoose.model("Product", productSchema);
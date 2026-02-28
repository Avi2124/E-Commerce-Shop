import mongoose from "mongoose";
const batchSchema = new mongoose.Schema({
    product: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true},
    shopkeeper: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true},
    quantity: {type: Number, required: true, min: 0},
    initialQuantity: {type: Number, required: true},
    expiryDate: {type: Date, required: true, index: true},
    status: {type: String, enum: ["ACTIVE", "EXPIRED", "DEPLETED"], default: "ACTIVE", index: true},
    isActive: {type: Boolean, default: true},
    isDelete: {type: Boolean, default: false},
} , {timestamps: true});

export const Batch = mongoose.model("Batch", batchSchema);
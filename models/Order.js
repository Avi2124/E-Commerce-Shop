import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    shopkeeper: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    allocations: [{
      batch: {type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true},
      quantityFromBatch: {type: Number, required: true},
      expiryDate: {type: Date, required: true}
    }]
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    isActive: {type: Boolean, default: true},
    isDelete: {type: Boolean, default: false},
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

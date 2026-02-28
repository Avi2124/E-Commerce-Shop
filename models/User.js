import mongoose from 'mongoose';
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Please enter a vaid email"]},
    password: {type: String, required: true},
    phone: {type: String, required: true, match: [/^[6-9]\d{9}$/, "Please enter a valid phone number"]},
    role: {type: String, enum: ["customer", "shopkeeper"], required: true, default: "customer"},
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Product"
    }],
    cartData: [{
        product: {type: mongoose.Schema.Types.ObjectId, ref: "Product"},
        quantity: {type: Number, required: true, default: 1}
    }],
    refreshToken: {type: String},
    otpCode: {type: String},
    otpExpiresAt: {type: Date},
    avatarUrl: {type: String, default: "https://t4.ftcdn.net/jpg/07/03/86/11/360_F_703861114_7YxIPnoH8NfmbyEffOziaXy0EO1NpRHD.jpg"},
    isActive: {type: Boolean, default: true},
    isDelete: {type: Boolean, default: false},
    fcmTokens: [{type: String}]
}, {timestamps: true});

userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
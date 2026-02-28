import Joi from "joi";
import mongoose from "mongoose";

const objectId = () => 
    Joi.string().custom((value, helpers) => {
        if(!mongoose.Types.ObjectId.isValid(value)){
            return helpers.message('Invalid id');
        }
        return value;
    }, 'ObjectId validation');

//This is user registration validations
export const signupSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(16).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    role: Joi.string().valid("customer", "shopkeeper").default("customer"),
});

// This is user login validations 
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// This is user login otp validation
export const verifyOtpScehma = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
});

// This is refreshToken validation
export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

export const idParamSchema = Joi.object({
    id: objectId().required()
});

// This is update user profile validations
export const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    password: Joi.string().min(6).max(16),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/),
    avatarUrl: Joi.string().uri(),
}).min(1);

// This is addToCart for customer validations
export const addToCartSchema = Joi.object({
    productId: objectId().required(),
    quantity: Joi.number().integer().min(1).default(1),
});

// This is wishlist for customer validations
export const whishlistSchema = Joi.object({
    productId: objectId().required(),
});

// This is user logout validation
export const logoutSchema = Joi.object({
    refreshToken: Joi.string().required()
});
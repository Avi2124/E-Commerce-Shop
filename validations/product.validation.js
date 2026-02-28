import Joi from "joi";
import mongoose from "mongoose";

const objectId = () =>
    Joi.string().custom((value, helpers) => {
        if(!mongoose.Types.ObjectId.isValid(value)) return helpers.message("Invalid Id");
        return value;
    }, "Object validation");

export const createProductScehma = Joi.object({
    name: Joi.string().min(2).max(80).required(),
    description: Joi.string().allow("").max(500),
    price: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).default(0),
    isActive: Joi.boolean().default(true),
    imageUrl: Joi.string().uri().allow("")
});

export const updateProductSchema = Joi.object({
    name: Joi.string().min(2).max(80),
    description: Joi.string().allow("").max(500),
    stock: Joi.number().integer().min(0).default(0),
    price: Joi.number().min(0),
    isActive: Joi.boolean(),
    imageUrl: Joi.string().uri().allow("")
}).min(1);

export const addStockSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required()
});

export const productIdParamSchema = Joi.object({
    id: objectId().required()
});
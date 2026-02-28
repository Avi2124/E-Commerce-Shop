import Joi from "joi";

export const createBatchSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required(),
    expiryDate: Joi.date().iso().required()
});
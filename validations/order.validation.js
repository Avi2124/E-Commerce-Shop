import Joi from "joi";
import mongoose from "mongoose";

const objectId = () =>
  Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) return helpers.message("Invalid id");
    return value;
  }, "ObjectId validation");

export const placeOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
        productId: objectId().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
});

export const orderIdParamSchema = Joi.object({
  id: objectId().required(),
});

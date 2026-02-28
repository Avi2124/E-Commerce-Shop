import express from "express";
const orderRouter = express.Router();

import { userMiddleware } from "../middlewares/user.middleware.js";
import { placeOrderSchema, orderIdParamSchema } from "../validations/order.validation.js";
import { placeOrder, getOrders, getOrderById, completeOrder } from "../controllers/order.controller.js";

orderRouter.post("/api/orders", userMiddleware({ auth: true, roles: ["customer"], body: placeOrderSchema }), placeOrder);

orderRouter.get("/api/orders", userMiddleware({ auth: true }), getOrders);
orderRouter.get("/api/orders/:id", userMiddleware({ auth: true, params: orderIdParamSchema }), getOrderById);

orderRouter.patch("/api/orders/:id/complete", userMiddleware({ auth: true, roles: ["shopkeeper"], params: orderIdParamSchema }), completeOrder);

export default orderRouter;

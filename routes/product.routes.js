import express from "express";
import { userMiddleware } from "../middlewares/user.middleware.js";
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct} from "../controllers/product.controller.js";
import { createProductScehma, productIdParamSchema, updateProductSchema} from "../validations/product.validation.js";
import { uploadProductImage } from "../middlewares/multer.middleware.js";
import { createBatch, getBatchesByProduct } from "../controllers/batch.controller.js";
import { createBatchSchema } from "../validations/batch.validation.js";
import { runExpiryJob } from "../utils/expiry.js";
const productRouter = express.Router();

productRouter.get("/api/products", userMiddleware({ auth: true }), getAllProducts);
productRouter.get("/api/products/:id", userMiddleware({ auth: true, params: productIdParamSchema }), getProductById);

productRouter.post("/api/products", userMiddleware({auth: true, roles: ["shopkeeper"], body: createProductScehma}), uploadProductImage, createProduct);
productRouter.patch("/api/product/:id", userMiddleware({auth: true, roles: ["shopkeeper"], params: productIdParamSchema, body: updateProductSchema}), uploadProductImage, updateProduct);
productRouter.delete("/api/product/:id", userMiddleware({auth: true, roles: ["shopkeeper"], params: productIdParamSchema}), deleteProduct);

productRouter.post("/api/product/:id/batches", userMiddleware({auth: true, roles: ["shopkeeper"], params: productIdParamSchema, body: createBatchSchema}), createBatch);
productRouter.get("/api/product/:id/batches", userMiddleware({auth: true, roles: ["shopkeeper"], params: productIdParamSchema}), getBatchesByProduct);

productRouter.post("/api/test/run-expiry", async (req, res) => {
    try {
        const result = await runExpiryJob();
        res.json({status: true, result});
    } catch (error) {
        res.json({status: false, error: error.message});
    }
});

export default productRouter;

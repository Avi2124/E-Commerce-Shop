import mongoose from "mongoose";
import { sendResponse } from "../utils/sendResponse.js";
import { Product } from "../models/Product.js";
import { Batch } from "../models/Batch.js";

export const createBatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const productId = req.params.id;
        const quantity = Number(req.body.quantity);
        const expiryDate = new Date(req.body.expiryDate);
        if(!quantity || Number.isNaN(quantity) || quantity <= 0){
            await session.abortTransaction();
            session.endSession();
            return sendResponse(res, {
                status: false,
                statusCode: 400,
                message: "Validation error",
                data: null,
                error: {details: "quantity must be a positive number"}
            });
        }

        if(!expiryDate || Number.isNaN(expiryDate.getTime())){
            await session.abortTransaction();
            session.endSession();
            return sendResponse(res, {
                status: false,
                statusCode: 400,
                message: "Validation error",
                data: null,
                error: {details: "expiryDate must be a valid date"}
            });
        }

        const product = await Product.findOne({_id: productId, shopkeeper: req.user.id, isActive: true, isDelete: false}).session(session);
        if(!product){
            await session.abortTransaction();
            session.endSession();
            return sendResponse(res, {
                status: false,
                statusCode: 404,
                message: "Product not found or not yours",
                data: null,
                error: {code: "NOT_FOUND"}
            });
        }
        const [batch] = await Batch.create([
            {
                product: product._id,
                shopkeeper: req.user.id, quantity,
                initialQuantity: quantity, expiryDate,
                status: "ACTIVE"
            },
        ], {session});

        product.stock += quantity;
        await product.save({session});

        await session.commitTransaction();
        session.endSession();

        return sendResponse(res,{
            status: true,
            statusCode: 201,
            message: "Batch created",
            data: {product, batch},
            error: null
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return sendResponse(res,{
            status: false,
            statusCode: 500,
            message: "Error creating batch",
            data: null,
            error: {details: error.message}
        });
    }
};

export const getBatchesByProduct = async (req, res) => {
    try {
        const product = await Product.findOne({_id: req.params.id, shopkeeper: req.user.id, isActive: true, isDelete: false});
        if(!product){
            return sendResponse(res, {
                status: false,
                statusCode: 404,
                message: "Product not found or not yours",
                data: null,
                error: {code: "NOT_FOUND"}
            });
        }

        let {
            page = 1,
            limit = 10,
            search = "",
            sortKey = "expiryDate",
            sortOrder = "asc",
            ...filters
        } = req.query;

        page = Number(page) || 1;
        limit = Number(limit) || 10;
        if(page < 1) page = 1;
        if(limit < 1) limit = 10;

        const match = {product: product._id, shopkeeper: product.shopkeeper, isActive: true, isDelete: false};
        Object.entries(filters).forEach(([key, value]) => {
            if(value === undefined || value === "") return;

            const values = String(value).split(",").map((v) => v.trim()).filter((v) => v !== "");

            if(!values.length) return;

            if(values.length === 1){
                match[key] = values[0];
            } else {
                match[key] = {$in: values};
            }
        });

        const pipeline = [];
        pipeline.push({$match: match});

        const searchFields = ["status"];
        if(search && searchFields.length){
            const regex = new RegExp(search, "i");
            pipeline.push({
                $match: {
                    $or: searchFields.map((field) => ({
                        [field]: {$regex: regex},
                    })),
                },
            });
        }

        const sortDir = sortOrder === "asc" ? 1 : -1;
        if(!sortKey) sortKey = "expiryDate";

        pipeline.push({
            $sort: {[sortKey]: sortDir, _id: -1},
        });

        const skip = (page - 1) * limit;

        pipeline.push({
            $facet: {
                data: [{$skip: skip}, {$limit: limit}],
                total: [{$count: "count"}]
            },
        });

        const result = await Batch.aggregate(pipeline);
        const data = result[0]?.data || [];
        const total = result[0]?.total?.[0]?.count || 0;
 
        // const batches = await Batch.find({product: product._id, shopkeeper: req.user.id}).sort({expiryDate: 1, createdAt: 1});
        return sendResponse(res, {
            status: true,
            statusCode: 200,
            message: "Batch fetched",
            data: {items: data, total, page, limit},
            error: null
        });
    } catch (error) {
        return sendResponse(res, {
            status: false,
            statusCode: 500,
            message: "Error fetching batches",
            data: null,
            error: {details: error.message}
        });
    }
};
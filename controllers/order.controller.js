import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { sendResponse } from "../utils/sendResponse.js";
import { Batch } from "../models/Batch.js";

export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;
    const merged = new Map();
    for (const it of items) {
      const key = String(it.productId);
      merged.set(key, (merged.get(key) || 0) + it.quantity);
    }
    const normalized = [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));

    const productIds = normalized.map((i) => i.productId);

    const products = await Product.find({ _id: { $in: productIds }, isActive: true, isDelete: false }).session(session);

    if (products.length !== productIds.length) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "One or more products invalid/inactive",
        data: null,
        error: { code: "INVALID_PRODUCTS" },
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    const now = new Date();

    for (const reqItem of normalized) {
      const p = products.find((x) => String(x._id) === String(reqItem.productId));

      if (p.stock < reqItem.quantity) {
        await session.abortTransaction();
        session.endSession();
        return sendResponse(res, {
          status: false,
          statusCode: 400,
          message: `Insufficient stock for ${p.name}`,
          data: null,
          error: { code: "OUT_OF_STOCK" },
        });
      }

      const batches = await Batch.find({
        product: p._id,
        shopkeeper: p.shopkeeper,
        status: "ACTIVE",
        expiryDate: {$gt: now},
        quantity: {$gt: 0},
        isActive: true,
        isDelete: false
      }).sort({expiryDate: 1, createdAt: 1}).session(session);

      const available = batches.reduce((sum, b) => sum + b.quantity, 0);
      if(available < reqItem.quantity){
        await session.abortTransaction();
        session.endSession();
        return sendResponse(res,{
          status: false,
          statusCode: 400,
          message: `stock changed for ${p.name}, try again`,
          data: null,
          error: {code: "STOCK_CHANGED"}
        });
      }

      let qtyToSell = reqItem.quantity;
      const allocations = [];

      for(const b of batches){
        if(qtyToSell <= 0) break;
        const take = Math.min(b.quantity, qtyToSell);
        b.quantity -= take;
        qtyToSell -= take;

        allocations.push({
          batch: b._id,
          quantityFromBatch: take,
          expiryDate: b.expiryDate
        });

        if(b.quantity === 0){
          b.status = "DEPLETED";
        }
        await b.save({session});
      }

      const updated = await Product.updateOne(
        {_id: p._id, stock: {$gte: reqItem.quantity}},
        {$inc: {stock: -reqItem.quantity}},
        {session}
      );

      if(updated.modifiedCount !== 1){
        await session.abortTransaction();
        session.endSession();
        return sendResponse(res, {
          status: false,
          statusCode: 400,
          message: "stock changed, try again",
          data: null,
          error: {code: "STOCK_CHANGED"}
        });
      }

      const unitPrice = p.price;
      const lineTotal = unitPrice * reqItem.quantity;

      orderItems.push({
        product: p._id,
        shopkeeper: p.shopkeeper,
        quantity: reqItem.quantity,
        unitPrice,
        lineTotal,
        allocations
      });

      totalAmount += lineTotal;
    }

    const [order] = await Order.create(
      [
        {
          customer: req.user.id,
          items: orderItems,
          totalAmount,
          status: "pending",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, {
      status: true,
      statusCode: 201,
      message: "Order placed",
      data: order,
      error: null,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error placing order",
      data: null,
      error: { details: error.message },
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sortKey = "createdAt",
      sortOrder = "desc",
      ...filters
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const match = {
      isActive: true,
      isDelete: false,
    };

    if (req.user.role === "customer") {
      match.customer = new mongoose.Types.ObjectId(req.user.id);
    } else {
      match["items.shopkeeper"] = new mongoose.Types.ObjectId(req.user.id);
    }

    // Filtering
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === "") return;

      const values = String(value)
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v !== "");

      if (!values.length) return;

      if (values.length === 1) {
        match[key] = values[0];
      } else {
        match[key] = { $in: values };
      }
    });

    const pipeline = [];
    pipeline.push({ $match: match });

    // Search (status is OK; remove paymentStatus if you don't have it)
    const searchFields = ["status"];
    if (search && searchFields.length) {
      const regex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: searchFields.map((field) => ({
            [field]: { $regex: regex },
          })),
        },
      });
    }

    const sortDir = sortOrder === "asc" ? 1 : -1;
    if (!sortKey) sortKey = "createdAt";
    pipeline.push({
      $sort: { [sortKey]: sortDir, _id: -1 },
    });

    const skip = (page - 1) * limit;
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "count" }],
      },
    });

    const result = await Order.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    // const filter =
    //   req.user.role === "customer"
    //     ? { customer: req.user.id }
    //     : { "items.shopkeeper": req.user.id };
  
    // const orders = await Order.find(filter).sort({ createdAt: -1 });
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Orders fetched",
      data: { items: data, total, page, limit },
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error fetching orders",
      data: null,
      error: { details: error.message },
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "Order not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }

    if (req.user.role === "customer") {
      if (String(order.customer) !== req.user.id) {
        return sendResponse(res, {
          status: false,
          statusCode: 403,
          message: "Access denied",
          data: null,
          error: { code: "FORBIDDEN" },
        });
      }
    } else {
      const belongs = order.items.some((it) => String(it.shopkeeper) === req.user.id);
      if (!belongs) {
        return sendResponse(res, {
          status: false,
          statusCode: 403,
          message: "Access denied",
          data: null,
          error: { code: "FORBIDDEN" },
        });
      }
    }

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Order fetched",
      data: order,
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error fetching order",
      data: null,
      error: { details: error.message },
    });
  }
};

export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "Order not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }

    const belongs = order.items.some((it) => String(it.shopkeeper) === req.user.id);
    if (!belongs) {
      return sendResponse(res, {
        status: false,
        statusCode: 403,
        message: "Access denied",
        data: null,
        error: { code: "FORBIDDEN" },
      });
    }

    if (order.status === "completed") {
      return sendResponse(res, {
        status: true,
        statusCode: 200,
        message: "Order already completed",
        data: order,
        error: null,
      });
    }

    order.status = "completed";
    order.completedAt = new Date();
    await order.save();

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Order marked as completed",
      data: order,
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error completing order",
      data: null,
      error: { details: error.message },
    });
  }
};

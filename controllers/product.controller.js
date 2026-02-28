import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { sendResponse } from "../utils/sendResponse.js";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

// This is createProduct Controller
export const createProduct = async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description || "";
    const price = Number(req.body.price);
    const stock = 0;
    const isActive =
      req.body.isActive !== undefined ? req.body.isActive === "true" : true;

    if (!name || Number.isNaN(price)) {
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "Validation error",
        data: null,
        error: {
          details: "name and price are required (price must be number)",
        },
      });
    }

    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "ecommerce/products",
        resource_type: "image",
      });

      imageUrl = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    const product = await Product.create({
      shopkeeper: req.user.id,
      name,
      description,
      price,
      stock,
      isActive,
      imageUrl,
    });

    return sendResponse(res, {
      status: true,
      statusCode: 201,
      message: "Product added",
      data: product,
      error: null,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error creating product",
      data: null,
      error: { details: error.message },
    });
  }
};

// This is Show All Product controller
export const getAllProducts = async (req, res) => {
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
    if(page < 1) page = 1;
    if(limit < 1) limit = 10;

    const match = {isActive: true, isDelete: false};
    if(req.user.role === "shopkeeper"){
      match.shopkeeper = new mongoose.Types.ObjectId(req.user.id);
    }
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
    const searchFields = ["name", "description"];
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
    if(!sortKey) sortKey = "createdAt";

    pipeline.push({
      $sort: {[sortKey]: sortDir, _id: -1},
    });

    const skip = (page - 1) * limit;
    pipeline.push({
      $facet: {
        data: [{$skip: skip}, {$limit: limit}],
        total: [{$count: "count"}],
      },
    });
    const result = await Product.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    // const filter =
    //   req.user.role == "shopkeeper"
    //     ? { shopkeeper: req.user.id }
    //     : { isActive: true };
    // const products = await Product.find(filter).sort({ createdAt: -1 });

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Products fetched",
      data: {items: data, total, page, limit},
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error fetching products",
      data: null,
      error: { details: error.message },
    });
  }
};

// This is for particular shopkeeper search product by id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "Product not found",
        error: { code: "NOT_FOUND" },
      });
    }

    if (
      req.user.role === "shopkeeper" &&
      String(product.shopkeeper) !== req.user.id
    ) {
      return sendResponse(res, {
        status: false,
        statusCode: 403,
        message: "Access denied (not your product)",
        data: null,
        error: { code: "FORBIDDEN" },
      });
    }

    if (req.user.role === "customer" && !product.isActive) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "Product not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Product fetched",
      data: product,
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error fetching product",
      data: null,
      error: { details: error.message },
    });
  }
};

// Update product contoller
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      shopkeeper: req.user.id,
    });

    if (!product) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "Product not found or not yours",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }

    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.description !== undefined)
      product.description = req.body.description;
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.isActive !== undefined)
      product.isActive = req.body.isActive === "true";

    if (req.file) {
      if (product.imageUrl) {
        const publicId = product.imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`ecommerce/products/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "ecommerce/products",
        resource_type: "image",
      });

      product.imageUrl = result.secure_url;

      fs.unlinkSync(req.file.path);
    }

    await product.save();

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Product updated",
      data: product,
      error: null,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error updating product",
      data: null,
      error: { details: error.message },
    });
  }
};

// Delete Product Used Soft Delete
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findOneAndUpdate({
      _id: req.params.id,
      shopkeeper: req.user.id,
      isDelete: false,
    },
  {
    $set: {isDelete: true, isActive: false}
  }, {new: true});
    if (!deleted) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "Product not found or not yours",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Product deleted (soft)",
      data: deleted,
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error deleting product",
      data: null,
      error: { details: error.message },
    });
  }
};


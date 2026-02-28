import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { sendResponse } from "../utils/sendResponse.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { sendOtpMail } from "../config/mailer.js";

//This is OTP generate function
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

//This is user signup controller
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return sendResponse(res, {
        status: false,
        statusCode: 409,
        message: "Email already registered",
        data: null,
        error: { code: "EMAIL_EXISTS" },
      });
    }

    const user = await User.create({ name, email, password, phone, role });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return sendResponse(res, {
      status: true,
      statusCode: 201,
      message: "Signup successfull",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        tokens: { accessToken, refreshToken },
      },
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Internal server error during signup",
      data: null,
      error: { details: error.message },
    });
  }
};

// This is user login controller check user credentials and send otp
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      email, isActive: true, isDelete: false
     });
    if (!user) {
      return sendResponse(res, {
        status: false,
        statusCode: 401,
        message: "Invalid email or password",
        data: null,
        error: { code: "INVALID_CREDENTIALS" },
      });
    }

    const isCorrect = await user.isPasswordCorrect(password);
    if (!isCorrect) {
      return sendResponse(res, {
        status: false,
        statusCode: 401,
        message: "Invalid email or password",
        data: null,
        error: { code: "INVALID_CREDENTIALS" },
      });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    user.otpCode = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpMail({ to: user.email, otp });

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "OTP sent to your email. Please verify to complete login.",
      data: { email: user.email },
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Internal server error uring login",
      data: null,
      error: { details: error.message },
    });
  }
};

// This is verify that otp which is sent to the user login id

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const user = await User.findOne({ email, isActive: true, isDelete: false });
    if (!user) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }

    if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "OTP expired or invalid. Please login again.",
        data: null,
        error: { code: "OTP_EXPIRED" },
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "Incorrect OTP",
        data: null,
        error: { code: "OTP_INCORRECT" },
      });
    }

    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "OTP verifird. Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        tokens: { accessToken, refreshToken },
      },
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Internal server error during OTP verification",
      data: null,
      error: { details: error.message },
    });
  }
};

// Refresh accessToken controller
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "Refresh Token is required",
        data: null,
        error: { code: "NO_REFRESH_TOKEN" },
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      const isExpired = error.name === "TokenExpiredError";
      return sendResponse(res, {
        status: false,
        statusCode: 401,
        message: isExpired ? "Refresh token expired" : "Invalid refresh token",
        data: null,
        error: { code: isExpired ? "REFRESH_EXPIRED" : "INVALID_REFRESH" },
      });
    }

    const user = await User.findOne({_id: decoded._id, isActive: true, isDelete: false});
    if (!user || user.refreshToken !== refreshToken) {
      return sendResponse(res, {
        status: false,
        statusCode: 401,
        message: "Refresh token not recognized",
        data: null,
        error: { code: "REFRESH_MISMATCH" },
      });
    }

    // This is generate new access token
    const newAccessToken = generateAccessToken(user);

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "Access token refreshed",
      data: { accessToken: newAccessToken },
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Token refresh error",
      data: null,
      error: { details: error.message },
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if(req.user.role !== "shopkeeper"){
      return sendResponse(res, {
        status: false,
        statusCode: 403,
        message: "Only shopkeeper can view users list",
        data: null,
        erorr: {code: "FORBIDDEN"},
      });
    }

    let{
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
    const match = {isActive: true, isDelete: false, role: "customer"};
    Object.entries(filters).forEach(([key, value]) => {
      if(!value && value !== 0) return;
      if(key === "role"){
        return;
      }
      const values = String(value).split(",").map((v) => v.trim()).filter((v) => v !== "");
      if(!values.length) return;
      if(getAllUsers.length === 1){
        match[key] = values[0];
      } else {
        match[key] = {$in: values};
      }
    });
    const pipeline = [];

    pipeline.push({$match: match});
    const searchFields = ["name", "email", "phone"];
    if(search && searchFields.length){
      const regex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: searchFields.map((field) => ({
            [field]: {$regex: regex}
          })),
        },
      });
    }
    const sortDir = sortOrder === "asc" ? 1 : -1;
    if(!sortKey) sortKey = "createAt";

    pipeline.push({
      $sort: {[sortKey]: sortDir, _id: -1}
    });

    const skip = (page - 1) * limit;
    pipeline.push({
      $facet: {
        data: [{$skip: skip}, {$limit: limit}],
        total: [{$count: "count"}]
      },
    });

    const result = await User.aggregate(pipeline);
    const data = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

    const safeUsers = data.map((user) => {
      const {password, refreshToken, otpCode, otpExpiresAt, ...rest} = user;
      return rest;
    });
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "User fetched successfully",
      data: {items: safeUsers, total, page, limit},
      error: null
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error fetching users",
      data: null,
      error: {details: error.message}
    });
  }
};

// This is get details by id for customer to show profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({_id: req.params.id, isActive: true, isDelete: false}).select(
      "-password -refreshToken -otpCode -otpExpiresAt",
    );
    if (!user) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "User fetched succssfully",
      data: user,
      error: null,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Internal server error",
      data: null,
      error: { details: error.message },
    });
  }
};

// This is update user profile data means update user

export const updateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({_id: req.params.id, isDelete: false}, req.body, {
      new: true,
    }).select(
      "-_id -password -createdAt -updatedAt -__v -refreshToken -otpCode -otpExpiresAt",
    );
    if (!user) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "User updated successfully",
      data: user,
      error: null,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Internal server error",
      data: null,
      error: { details: error.message },
    });
  }
};

// This is FCM token for logged-in user
export const registerFcmToken = async (req, res) => {
  try {
    const {fcmToken} = req.body || {};
    if(!fcmToken){
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        data: null,
        error: {code: "NO_FCM_TOKEN"}
      });
    }
    const user = await User.findOne({_id: req.user.id, isActive: true, isDelete: false});
    if(!user){
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "fcmToken is required",
        data: null,
        error: {code: "NOT_FOUND"}
      });
    }
    user.fcmTokens = user.fcmTokens || [];
    if(!user.fcmTokens.includes(fcmToken)){
      user.fcmTokens.push(fcmToken);
      await user.save();
    }
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "FCM token registered",
      data: null,
      error: null
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error registering FCM token",
      data: null,
      error: {details: error.message}
    });
  }
};

// This is logout controller
export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "Refresh token is required to logout",
        data: null,
        error: { code: "NO_REFRESH_TOKEN" },
      });
    }

    const user = await User.findOne({ refreshToken, isActive: true, isDelete: false });
    if (!user) {
      return sendResponse(res, {
        status: false,
        statusCode: 400,
        message: "Invalid refresh token",
        data: null,
        error: { code: "INVALID_REFRESH_TOKEN" },
      });
    }

    user.refreshToken = null;
    await user.save();

    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "User Logged out successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Internal server error during logout",
      data: null,
      error: { details: error.message },
    });
  }
};

// Delete User by Soft Delete
export const deleteUser = async (req, res) => {
  try {
    if(req.user.role !== "shopkeeper"){
      return sendResponse(res, {
        status: false,
        statusCode: 403,
        message: "Only shopkeeper can delete users",
        data: null,
        error: {code: "FORBIDDEN"}
      });
    }
    const deleted = await User.findOneAndUpdate(
      {_id: req.params.id, isDelete: false},
      {$set: {isDelete: true, isActive: false} },
      {new: true});
    if (!deleted) {
      return sendResponse(res, {
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
        error: { code: "NOT_FOUND" },
      });
    }
    return sendResponse(res, {
      status: true,
      statusCode: 200,
      message: "User deleted (soft)",
      data: deleted,
      error: null,
    });
  } catch (error) {
    return sendResponse(res, {
      status: false,
      statusCode: 500,
      message: "Error deleting user",
      data: null,
      error: { details: error.message },
    });
  }
};
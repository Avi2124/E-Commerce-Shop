import express from "express";
import { deleteUser, getAllUsers, getUserProfile, login, logoutUser, refreshAccessToken, registerFcmToken, signup, updateUser, verifyLoginOtp } from "../controllers/user.controller.js";
import { userMiddleware } from "../middlewares/user.middleware.js";
import { idParamSchema, loginSchema, logoutSchema, refreshTokenSchema, signupSchema, updateProfileSchema, verifyOtpScehma } from "../validations/user.validation.js";
const userRouter = express.Router();

userRouter.post("/api/auth/signup", userMiddleware({body: signupSchema}), signup);
userRouter.post("/api/auth/login", userMiddleware({body: loginSchema}), login);
userRouter.post("/api/auth/verify-otp", userMiddleware({body: verifyOtpScehma}), verifyLoginOtp);
userRouter.post("/api/auth/refresh-token", userMiddleware({body: refreshTokenSchema}), refreshAccessToken);
userRouter.post("/api/auth/logout", userMiddleware({body: logoutSchema}), logoutUser);

userRouter.post("/api/users/register-fcm", userMiddleware({auth: true}), registerFcmToken);

userRouter.delete("/api/users/:id", userMiddleware({auth: true, roles: ["shopkeeper"], params: idParamSchema}), deleteUser);
userRouter.get("/api/users/profile/:id", userMiddleware({auth: true, params: idParamSchema}), getUserProfile);
userRouter.put("/api/users/profile-update/:id", userMiddleware({auth: true, params: idParamSchema, body: updateProfileSchema}), updateUser);
userRouter.get("/api/users", userMiddleware({auth: true, roles: ["shopkeeper"]}), getAllUsers);

export default userRouter;
import express from "express";
import {
       changeCurrentUserPassword,
       getMe,
       login,
       logout,
       refreshToken,
       register,
       updateProfile,
} from "../controllers/user.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(checkAuth, logout);
router.route("/refresh-token").get(checkAuth, refreshToken);
router.route("/change-password").post(checkAuth, changeCurrentUserPassword);
router.route("/me").get(checkAuth, getMe);
router.route("/update-profile").patch(checkAuth, updateProfile);

export default router;

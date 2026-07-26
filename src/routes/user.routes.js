import express from "express";
import { login, logout, register } from "../controllers/user.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(checkAuth, logout);

export default router;

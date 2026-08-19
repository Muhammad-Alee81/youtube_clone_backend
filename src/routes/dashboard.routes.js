import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(checkAuth);

router.route("/stats").get(getStats);

export default router;

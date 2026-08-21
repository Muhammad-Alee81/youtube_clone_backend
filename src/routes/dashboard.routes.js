import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getStats, getTopVideos } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(checkAuth);

router.route("/stats").get(getStats);
router.route("/top-videos").get(getTopVideos);

export default router;

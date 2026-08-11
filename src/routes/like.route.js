import express from "express";
import { toggleVideoLike } from "../controllers/like.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/v/:videoId").post(checkAuth , toggleVideoLike);

export default router;

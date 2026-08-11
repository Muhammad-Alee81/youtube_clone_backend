import express from "express";
import {
        toggleCommentLike,
        togglePostLike,
        toggleVideoLike,
} from "../controllers/like.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/v/:videoId").post(checkAuth, toggleVideoLike);
router.route("/c/:commentId").post(checkAuth, toggleCommentLike);
router.route("/p/:postId").post(checkAuth, togglePostLike);

export default router;

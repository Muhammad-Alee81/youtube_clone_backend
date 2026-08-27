import express from "express";
import {
        getAllLikedVideos,
        toggleCommentLike,
        togglePostLike,
        toggleVideoLike,
} from "../controllers/like.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.midleware.js";
import { queryValidation } from "../validators/query.validators.js";

const router = express.Router();

router.route("/v/:videoId").post(checkAuth, toggleVideoLike);
router.route("/c/:commentId").post(checkAuth, toggleCommentLike);
router.route("/p/:postId").post(checkAuth, togglePostLike);

router.route("/liked-videos").get(
        checkAuth,
        validation(queryValidation),
        getAllLikedVideos
);

export default router;

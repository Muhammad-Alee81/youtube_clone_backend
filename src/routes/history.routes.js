import express from "express";
import {
        addVideoToWatchHistory,
        removeVideoFromHistory,
} from "../controllers/watchHistory.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/:videoId")
        .post(checkAuth, addVideoToWatchHistory)
        .delete(checkAuth, removeVideoFromHistory);

export default router;

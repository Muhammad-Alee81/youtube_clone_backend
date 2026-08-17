import express from "express";
import {
        addVideoToWatchHistory,
        clearAllWatchHistory,
        getUsersWatchHistory,
        removeVideoFromHistory,
} from "../controllers/watchHistory.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/").get(checkAuth, getUsersWatchHistory);
router.route("/clear-history").delete(checkAuth, clearAllWatchHistory);
router.route("/:videoId")
        .post(checkAuth, addVideoToWatchHistory)
        .delete(checkAuth, removeVideoFromHistory);

export default router;

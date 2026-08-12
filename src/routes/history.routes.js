import express from "express";
import { addVideoToWatchHistory } from "../controllers/watchHistory.controller.js";

const router = express.Router();

router.route("/:videoId").post(addVideoToWatchHistory);

export default router;

import express from "express";
import { subscribeChannel } from "../controllers/subscription.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/c/:channelId/subscribe").post(checkAuth, subscribeChannel);

export default router;

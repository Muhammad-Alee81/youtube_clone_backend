import express from "express";
import { subscribeChannel, unSubscribeChannel } from "../controllers/subscription.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/c/:channelId/subscribe").post(checkAuth, subscribeChannel);
router.route("/c/:channelId/unsubscribe").delete(checkAuth, unSubscribeChannel);

export default router;

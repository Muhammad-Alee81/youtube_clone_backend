import express from "express";
import { recentSubscribers, subscribeChannel, unSubscribeChannel } from "../controllers/subscription.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/c/:channelId/subscribe").post(checkAuth, subscribeChannel);
router.route("/c/:channelId/unsubscribe").delete(checkAuth, unSubscribeChannel);

router.route('/subscribers/recent').get(checkAuth , recentSubscribers)

export default router;

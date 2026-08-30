import express from "express";
import {
    getSubscribedChannels,
    recentSubscribers,
    subscribeChannel,
    unSubscribeChannel,
} from "../controllers/subscription.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.midleware.js";
import { queryValidation } from "../validators/query.validators.js";

const router = express.Router();

router.route("/c/:channelId/subscribe").post(checkAuth, subscribeChannel);
router.route("/c/:channelId/unsubscribe").delete(checkAuth, unSubscribeChannel);

router
    .route("/subscribers/recent")
    .get(checkAuth, validation(queryValidation), recentSubscribers);

router
    .route("/my")
    .get(checkAuth, validation(queryValidation), getSubscribedChannels);

export default router;

import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import {
        getStats,
        getTopVideos,
} from "../controllers/dashboard.controller.js";
import { validation } from "../middlewares/validation.midleware.js";
import { queryValidation } from "../validators/query.validators.js";

const router = express.Router();

router.use(checkAuth);

router.route("/stats").get(getStats);
router.route("/top-videos").get(
        validation(queryValidation),
        getTopVideos
);

export default router;

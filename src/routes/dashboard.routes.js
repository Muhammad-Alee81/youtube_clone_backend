import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getRecentVideos, getStats, getTopVideos } from "../controllers/dashboard.controller.js";
import { validation } from "../middlewares/validation.midleware.js";
import { queryValidation } from "../validators/query.validators.js";

const router = express.Router();

router.use(checkAuth);

router.route("/stats").get(getStats);

// http://localhost:4000/api/v1/dashboard/top-videos?sort=views
// http://localhost:4000/api/v1/dashboard/top-videos?sort=likesCount
// http://localhost:4000/api/v1/dashboard/top-videos?sort=commentsCount
router.route("/top-videos").get(validation(queryValidation), getTopVideos);

router.route("/recent-videos").get(getRecentVideos);

export default router;

import express from "express";
import {
       getAllVideos,
       getVideoById,
       uploadVideo,
} from "../controllers/video.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validation } from "../middlewares/validation.midleware.js";
import { getAllVideoQueryValidate } from "../validators/video.validators.js";

const router = express.Router();

router.route("/upload-video").post(
       checkAuth,
       upload.fields([
              { name: "thumbnail", maxCount: 1 },
              { name: "video", maxCount: 1 },
       ]),
       uploadVideo
);

router.route("/all").get(validation(getAllVideoQueryValidate), getAllVideos);
router.route("/video/:videoId").get(getVideoById);

export default router;

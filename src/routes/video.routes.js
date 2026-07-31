import express from "express";
import {
       deleteVideo,
       getAllVideos,
       getVideoById,
       updateVideo,
       uploadVideo,
} from "../controllers/video.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validation } from "../middlewares/validation.midleware.js";
import { getAllVideoQueryValidate } from "../validators/video.validators.js";

const router = express.Router();

router.route("/all").get(validation(getAllVideoQueryValidate), getAllVideos);
router.route("/video/:videoId").get(getVideoById);

router.use(checkAuth);

router.route("/upload-video").post(
       upload.fields([
              { name: "thumbnail", maxCount: 1 },
              { name: "video", maxCount: 1 },
       ]),
       uploadVideo
);

router.route("/update/:videoId").patch(upload.single("thumbnail"), updateVideo);
router.route("/delete/:videoId").delete(deleteVideo);

export default router;

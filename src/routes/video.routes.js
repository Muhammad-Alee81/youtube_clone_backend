import express from "express";
import { getAllVideos, uploadVideo } from "../controllers/video.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route("/upload-video").post(
       checkAuth,
       upload.fields([
              { name: "thumbnail", maxCount: 1 },
              { name: "video", maxCount: 1 },
       ]),
       uploadVideo
);

router.route("/all").get(getAllVideos);

export default router;

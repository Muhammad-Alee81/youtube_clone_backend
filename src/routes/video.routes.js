import express from "express";
import {
        deleteVideo,
        getAllVideos,
        getVideoById,
        myVideos,
        togglePublishStatus,
        updateVideo,
        uploadVideo,
} from "../controllers/video.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validation } from "../middlewares/validation.midleware.js";
import { getAllVideoQueryValidate } from "../validators/video.validators.js";
import commentRouter from "./comment.routes.js";

const router = express.Router();

// NESTED ROUTE OF VIDEO COMMENTs
router.use("/:videoId/comments/parent", commentRouter);
/*-----------------------------------------------------------------------*/

router.route("/all").get(validation(getAllVideoQueryValidate), getAllVideos);
router.route("/:videoId").get(getVideoById);

router.use(checkAuth);
router.route("/upload-video").post(
        upload.fields([
                { name: "thumbnail", maxCount: 1 },
                { name: "video", maxCount: 1 },
        ]),
        uploadVideo
);

router.route("/my/videos").get(validation(getAllVideoQueryValidate), myVideos);
router.route("/update/:videoId").patch(upload.single("thumbnail"), updateVideo);
router.route("/delete/:videoId").delete(deleteVideo);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;

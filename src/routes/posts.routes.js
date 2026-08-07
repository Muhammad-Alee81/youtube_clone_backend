import express from "express";
import {
        createPost,
        deletePost,
        getAllPost,
        updatePost,
} from "../controllers/post.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
        addCommentOnPost,
        getAllParentCommentsOnPost,
} from "../controllers/comment.controller.js";

const router = express.Router({ mergeParams: true });

router.route("/:postId/comment")
        .post(checkAuth, addCommentOnPost)
        .get(getAllParentCommentsOnPost);

router.use(checkAuth);

router.route("/").get(getAllPost);
router.route("/create").post(upload.array("images", 8), createPost);
router.route("/:postId").delete(deletePost);
router.route("/:postId").patch(updatePost);

export default router;

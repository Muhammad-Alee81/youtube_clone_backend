import express from "express";
import {
    createPost,
    deletePost,
    getAllPost,
    myPosts,
    updatePost,
} from "../controllers/post.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
    addCommentOnPost,
    getAllParentCommentsOnPost,
} from "../controllers/comment.controller.js";
import { validation } from "../middlewares/validation.midleware.js";
import { commentQueryValidation } from "../validators/comment.validators.js";
import { queryValidation } from "../validators/query.validators.js";

const router = express.Router({ mergeParams: true });

router
    .route("/:postId/comment")
    .post(checkAuth, addCommentOnPost)
    .get(validation(commentQueryValidation), getAllParentCommentsOnPost);

router.route("/").get(validation(queryValidation), getAllPost);

router.use(checkAuth);

router.route("/my-posts").get(validation(queryValidation), myPosts);
router.route("/create").post(upload.array("images", 8), createPost);
router.route("/:postId").delete(deletePost);
router.route("/:postId").patch(updatePost);

export default router;

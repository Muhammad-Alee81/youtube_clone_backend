import express from "express";
import {
        addComment,
        deleteComment,
        getAllParentComments,
        replyToComment,
        updateComment,
} from "../controllers/comment.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { validation } from "../middlewares/validation.midleware.js";
import { commentQueryValidation } from "../validators/comment.validators.js";

const router = express.Router({ mergeParams: true });

router.use(checkAuth);
router.route("/:videoId/").post(addComment);

router.route("/:commentId/replies").post(replyToComment);
router.route("/:commentId/update").patch(updateComment);
router.route("/:commentId/delete").patch(deleteComment);

// NESTED ROUTE
router.route("/").get(validation(commentQueryValidation), getAllParentComments);

export default router;

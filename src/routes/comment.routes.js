import express from "express";
import { addComment, replyToComment, updateComment } from "../controllers/comment.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(checkAuth);
router.route("/:videoId/").post(addComment);
router.route("/:commentId/replies").post(replyToComment);
router.route("/:commentId/").patch(updateComment);

export default router;

import express from "express";
import { createPost } from "../controllers/post.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(checkAuth);

router.route("/create").post(upload.array("images", 8), createPost);

export default router;

import express from "express";
import { createPlaylist } from "../controllers/playlist.controllers.js";

import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(checkAuth);

router.route("/").post(createPlaylist);

export default router;

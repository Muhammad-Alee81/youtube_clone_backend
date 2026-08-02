import express from "express";
import { createPlaylist, getUsersPlaylist } from "../controllers/playlist.controllers.js";

import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(checkAuth);

router.route("/").post(createPlaylist);
router.route("/:userId").get(getUsersPlaylist);

export default router;

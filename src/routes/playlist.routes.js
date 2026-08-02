import express from "express";
import {
               createPlaylist,
               getPlayListById,
               getUsersPlaylist,
} from "../controllers/playlist.controllers.js";

import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(checkAuth);

router.route("/").post(createPlaylist);
router.route("/:id").get(getPlayListById);

/*users nested route*/
router.route("/").get(getUsersPlaylist);
/*--------------------------------------------*/

export default router;

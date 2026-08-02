import express from "express";
import {
        addVideoToPlaylist,
        createPlaylist,
        getPlayListById,
        getUsersPlaylist,
} from "../controllers/playlist.controllers.js";

import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(checkAuth);

router.route("/").post(createPlaylist);
router.route("/:id").get(getPlayListById);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

/*users nested route*/
router.route("/").get(getUsersPlaylist);
/*--------------------------------------------*/

export default router;

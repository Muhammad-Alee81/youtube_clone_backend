import express from "express";
import {
        addVideoToPlaylist,
        createPlaylist,
        getPlayListById,
        getUsersPlaylist,
        removeVideoFromPlaylist,
} from "../controllers/playlist.controllers.js";

import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(checkAuth);

router.route("/").post(createPlaylist);
router.route("/:id").get(getPlayListById);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

/*users nested route*/
router.route("/").get(getUsersPlaylist);
/*--------------------------------------------*/

export default router;

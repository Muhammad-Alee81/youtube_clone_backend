import express from "express";
import {
    changeCurrentUserPassword,
    getMe,
    getUserChannelProfileDetails,
    login,
    logout,
    refreshToken,
    register,
    updateAvatar,
    updateCoverImage,
    updateProfile,
} from "../controllers/user.controller.js";

import playlistRouter from "../routes/playlist.routes.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

// NESTED ROUTES
router.use("/:userId/playlists", playlistRouter);
/* ----------------------------------------------------- */

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(checkAuth, logout);
router.route("/refresh-token").get(checkAuth, refreshToken);
router.route("/change-password").post(checkAuth, changeCurrentUserPassword);
router.route("/me").get(checkAuth, getMe);
router.route("/update-profile").patch(checkAuth, updateProfile);
router
    .route("/update-avatar")
    .patch(checkAuth, upload.single("avatar"), updateAvatar);

router
    .route("/update-cover-image")
    .patch(checkAuth, upload.single("coverImage"), updateCoverImage);

router.route("/:username").get(checkAuth, getUserChannelProfileDetails);

export default router;

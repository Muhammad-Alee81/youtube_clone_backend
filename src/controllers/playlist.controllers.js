import mongoose from "mongoose";

import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import { Video } from "../models/video.model.js";

export const createPlaylist = catchAsync(async (req, res, next) => {
        const { title, description, visibility } = req.body;

        if (!title) {
                return next(new ApiError("title is required", 400));
        }

        if (!req.user) {
                return next(new ApiError("unauthorized", 403));
        }

        const playlist = await Playlist.create({
                title,
                description: description || "",
                owner: req.user?.id,
                visibility,
        });

        return res.status(201).json({ message: "playlist created", playlist });
});

export const getUsersPlaylist = catchAsync(async (req, res, next) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
                return next(new ApiError("Invalid user id", 400));
        }

        let playLists;
        if (req.params.userId !== req.user.id) {
                playLists = await Playlist.find({
                        owner: req.params.userId,
                        visibility: "public",
                }).sort("-createdAt");
        } else {
                playLists = await Playlist.find({
                        owner: req.params.userId,
                }).sort("-createdAt");
        }

        return res.status(200).json({ count: playLists.length, playLists });
});

export const getPlayListById = catchAsync(async (req, res, next) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const playList = await Playlist.findById(req.params.id);

        if (!playList) {
                return next(new ApiError("playlist not found", 404));
        }

        if (playList?.owner.toString() !== req.user.id) {
                return next(new ApiError("unauthorized", 403));
        }

        return res.status(200).json({ status: "success", playList });
});

export const addVideoToPlaylist = catchAsync(async (req, res, next) => {
        const { videoId, playlistId } = req.params;

        if (!videoId || !playlistId) {
                return next(
                        new ApiError("video Id or playlist Id is required", 400)
                );
        }

        if (
                !mongoose.Types.ObjectId.isValid(videoId) ||
                !mongoose.Types.ObjectId.isValid(playlistId)
        ) {
                return next(new ApiError("Invalid Id", 400));
        }

        const video = await Video.findById(videoId);

        if (!video) {
                return next(new ApiError("Video not found", 404));
        }

        const newPlaylist = await Playlist.findOneAndUpdate(
                {
                        _id: playlistId,
                        owner: req.user.id,
                },
                {
                        $addToSet: {
                                videos: new mongoose.Types.ObjectId(videoId),
                        },
                },
                { returnDocument: "after" }
        );

        if (!newPlaylist) {
                return next(new ApiError("playlist not found", 404));
        }

        return res.status(200).json({
                message: "video added to playlist",
                playList: newPlaylist,
        });
});

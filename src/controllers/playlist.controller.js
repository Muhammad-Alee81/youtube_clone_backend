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

    return res.status(201).json({
        message: "playlist created",
        playlist: {
            _id: playlist._id,
            title: playlist.title,
            description: playlist.description,
            visibility: playlist.visibility,
            owner: playlist.owner,
            videos: playlist.videos,
            createdAt: playlist.createdAt,
        },
    });
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

    const data = playLists.map((el) => {
        const playlist = el;
        return {
            playlist: {
                _id: playlist._id,
                title: playlist.title,
                description: playlist.description,
                visibility: playlist.visibility,
                owner: playlist.owner,
                videos: playlist.videos,
                createdAt: playlist.createdAt,
            },
        };
    });

    return res.status(200).json({
        status: "success",
        result: playLists.length,
        data,
    });
});

export const getPlayListById = catchAsync(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const playList = await Playlist.findById(req.params.id);

    if (!playList) {
        return next(new ApiError("playlist not found", 404));
    }

    const isOwner = playList.owner.equals(req.params.id);

    if (!isOwner && playList.visibility === "private") {
        return next(new ApiError("playList not found", 403));
    }

    return res.status(200).json({ status: "success", playList });
});

export const addVideoToPlaylist = catchAsync(async (req, res, next) => {
    const { videoId, playlistId } = req.params;

    if (!videoId || !playlistId) {
        return next(new ApiError("video Id or playlist Id is required", 400));
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

    const playList = await Playlist.findOneAndUpdate(
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

    if (!playList) {
        return next(new ApiError("playlist not found", 404));
    }

    return res.status(200).json({
        message: "video added to playlist",
        playList: playList,
    });
});

export const removeVideoFromPlaylist = catchAsync(async (req, res, next) => {
    const { videoId, playlistId } = req.params;

    if (!videoId || !playlistId) {
        return next(new ApiError("video Id or playlist Id is required", 400));
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

    const playList = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user.id,
        },
        {
            $pull: {
                videos: videoId,
            },
        },
        { returnDocument: "after" }
    );

    if (!playList) {
        return next(new ApiError("Playlist not found", 404));
    }

    return res.status(200).json({ status: "success", playList });
});

export const deletePlayList = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const deletedPlayList = await Playlist.findOneAndDelete({
        _id: id,
        owner: req.user.id,
    });

    if (!deletedPlayList) {
        return next(new ApiError("Playlist not found", 404));
    }

    return res.status(200).json({ message: "playlist deleted successfully" });
});

export const updatePlaylist = catchAsync(async (req, res, next) => {
    const { title, description, visibility } = req.body;
    const { id } = req.params;

    if (title !== undefined && title.trim() === "") {
        return next(new ApiError("Title cannot be empty", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const updatedPlayList = await Playlist.findOneAndUpdate(
        {
            _id: id,
            owner: req.user.id,
        },
        {
            $set: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && {
                    description,
                }),
                ...(visibility !== undefined && { visibility }),
            },
        }
    );

    if (!updatedPlayList) {
        return next(new ApiError("playlist is not found", 404));
    }

    return res.status(200).json({ message: "playlist updated successfully" });
});

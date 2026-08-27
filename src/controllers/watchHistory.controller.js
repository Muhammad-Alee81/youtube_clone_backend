import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { WatchHistory } from "../models/history.model.js";
import { Video } from "../models/video.model.js";
import { pagination } from "../utils/aggreegation/pagination.js";

export const addVideoToWatchHistory = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 403));
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const video = await Video.findById(videoId);

        if (!video) {
                return next(new ApiError("Video not found", 404));
        }

        const addToHistory = await WatchHistory.findOneAndUpdate(
                {
                        video: videoId,
                        user: req.user?.id,
                },

                {
                        $set: {
                                watchedAt: new Date(),
                        },
                        $setOnInsert: {
                                video: videoId,
                                user: req.user.id,
                        },
                },

                {
                        upsert: true,
                        returnDocument: "after",
                }
        );

        return res.status(201).json({
                status: "success",
                message: "video added to watch history",
        });
});

export const removeVideoFromHistory = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const history = await WatchHistory.findOneAndDelete({
                video: videoId,
                user: req.user.id,
        });

        if (!history) {
                return next(
                        new ApiError("Video not found in watch history", 404)
                );
        }

        return res
                .status(200)
                .json({ message: "video removed from watch History" });
});

export const clearAllWatchHistory = catchAsync(async (req, res, next) => {
        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        const clearHistory = await WatchHistory.deleteMany({
                user: req.user?.id,
        });

        if (clearHistory.deletedCount === 0) {
                return next(new ApiError("No history found", 404));
        }

        return res
                .status(200)
                .json({ message: "All watch history cleared successfully" });
});

export const getUsersWatchHistory = catchAsync(async (req, res, next) => {
        const { page, limit } = req.validateQuery;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        const pipeline = [];

        pipeline.push(
                {
                        $match: {
                                user: new mongoose.Types.ObjectId(req.user.id),
                        },
                },
                {
                        $lookup: {
                                from: "videos",
                                foreignField: "_id",
                                localField: "video",
                                as: "videos",
                                pipeline: [
                                        {
                                                $project: {
                                                        title: 1,
                                                        thumbnail: 1,
                                                        videoFile: 1,
                                                        duration: 1,
                                                        views: 1,
                                                        owner: 1,
                                                },
                                        },
                                        {
                                                $lookup: {
                                                        from: "users",
                                                        foreignField: "_id",
                                                        localField: "owner",
                                                        as: "owner",
                                                        pipeline: [
                                                                {
                                                                        $project: {
                                                                                username: 1,
                                                                                fullName: 1,
                                                                        },
                                                                },
                                                        ],
                                                },
                                        },

                                        {
                                                $unwind: "$owner",
                                        },
                                ],
                        },
                }
        );

        pipeline.push({
                $project: {
                        watchedAt: 1,
                        videos: 1,
                },
        });

        pagination({ page, limit, pipeline, totalCount: "totalHistory" });

        const watchHistory = await WatchHistory.aggregate(pipeline);

        return res.status(200).json({ status: "success", watchHistory });
});


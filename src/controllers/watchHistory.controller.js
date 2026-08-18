import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { WatchHistory } from "../models/history.model.js";
import { Video } from "../models/video.model.js";

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

        return res.status(201).json({ status: "success" });
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

        const pageNum = page || 1;
        const limitNum = limit || 10;
        const skip = (pageNum - 1) * limitNum;

        const watchHistory = await WatchHistory.aggregate(
                {
                        $match: {
                                user: new mongoose.Types.ObjectId(req.user.id),
                        },
                },

                {
                        $facet: {
                                matadata: [
                                        {
                                                $count: "totalHistory",
                                        },
                                ],
                                data: [
                                        {
                                                $sort: {
                                                        watchedAt: -1,
                                                },
                                        },

                                        {
                                                $skip: skip,
                                        },

                                        {
                                                $limit: limitNum,
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
                                                                                foreignField:
                                                                                        "_id",
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
                                        },
                                        {
                                                $unwind: "$videos",
                                        },
                                ],
                        },
                },

                {
                        $project: {
                                pagination: {
                                        totalHistory: {
                                                $ifNull: [
                                                        {
                                                                $arrayElemAt: [
                                                                        "$matadata.totalHistory",
                                                                        0,
                                                                ],
                                                        },

                                                        0,
                                                ],
                                        },

                                        results: {
                                                $size: "$data",
                                        },
                                        pageSize: {
                                                $literal: limitNum,
                                        },

                                        totalPages: {
                                                $ceil: {
                                                        $divide: [
                                                                {
                                                                        $ifNull: [
                                                                                {
                                                                                        $arrayElemAt:
                                                                                                [
                                                                                                        "$matadata.totalComments",
                                                                                                        0,
                                                                                                ],
                                                                                },
                                                                                0,
                                                                        ],
                                                                },
                                                                limitNum,
                                                        ],
                                                },
                                        },
                                },

                                data: "$data",
                        },
                },
        ]);

        return res.status(200).json({ status: "success", watchHistory });
});

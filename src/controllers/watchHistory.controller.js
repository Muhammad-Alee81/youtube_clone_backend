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

import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/Likes.model.js";

export const toggleVideoLike = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const video = await Video.exists(new mongoose.Types.ObjectId(videoId));

        if (!video) {
                return next(new ApiError("Video not found", 404));
        }

        const checkLike = await Like.findOne({
                video: videoId,
                likedBy: req.user.id,
        });

        if (checkLike) {
                await Like.findByIdAndDelete(checkLike._id);
        } else {
                await Like.create({
                        video: videoId,
                        likedBy: req.user.id,
                });
        }

        return res.status(200).json({ status: "success" });
});

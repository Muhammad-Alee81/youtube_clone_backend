import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { WatchHistory } from "../models/history.model.js";

export const addVideoToWatchHistory = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (req.user?.id) {
                return next(new ApiError("unauthorized", 403));
        }

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        // const addToHistory = await WatchHistory.findOneAndUpdate({
        //         video: videoId,
        //         user: req.user.id,
        // } , {
        //   upsert:
        // });

        return res.status(201).json({ status: "success" });
});

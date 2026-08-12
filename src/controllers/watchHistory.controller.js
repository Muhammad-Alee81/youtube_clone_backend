import { catchAsync } from "../utils/catch_async.js";

export const addVideoToWatchHistory = catchAsync(async (req, res, next) => {
        return res.status(201).json({ status: "success" });
});

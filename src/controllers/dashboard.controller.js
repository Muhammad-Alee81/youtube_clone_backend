import { catchAsync } from "../utils/catch_async.js";

export const getStats = catchAsync(async (req, res, next) => {
        return res.status(200).json({ status: "success" });
});

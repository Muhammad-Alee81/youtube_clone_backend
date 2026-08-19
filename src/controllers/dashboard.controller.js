import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
/*

1) total views 
2) total videos
3) total subscribers
4) total likes 
5)total comments

*/
export const getStats = catchAsync(async (req, res, next) => {
        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        return res.status(200).json({ status: "success" });
});

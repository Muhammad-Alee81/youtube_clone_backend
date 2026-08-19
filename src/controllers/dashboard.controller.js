import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";

import mongoose from "mongoose";
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

        const [subscribers, stats] = await Promise.all([
                Subscription.countDocuments({
                        channel: req.user.id,
                }),

                Video.aggregate([
                        {
                                $match: {
                                        owner: new mongoose.Types.ObjectId(
                                                req.user.id
                                        ),
                                },
                        },
                        {
                                $group: {
                                        _id: null,
                                        totalVideos: { $sum: 1 },
                                        totalViews: { $sum: "$views" },
                                        totalLikes: { $sum: "$likesCount" },
                                        totalComments: {
                                                $sum: "$commentsCount",
                                        },
                                },
                        },
                ]),
        ]);
        const videoStats = stats[0] || {
                totalVideos: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
        };

        return res.status(200).json({
                status: "success",
                stats: {
                        ...videoStats,
                        totalSubscribers: subscribers,
                },
        });
});

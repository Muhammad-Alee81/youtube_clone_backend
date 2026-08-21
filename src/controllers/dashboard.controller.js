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

/*

top videos lenay k liye mughay 

sab sy pehly videos ka raw data nikalna hoo ga time period k hisaab sy like agr last 7 days

*/
export const getTopVideos = catchAsync(async (req, res, next) => {
        const { sort } = req.validateQuery;

        if (!sort) {
                return next(new ApiError("error here", 500));
        }

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        const topViewedVideos = await Video.aggregate([
                {
                        $match: {
                                owner: new mongoose.Types.ObjectId(req.user.id),
                        },
                },

                {
                        $sort: {
                                [sort]: -1,
                        },
                },

                {
                        $limit: 5,
                },

                {
                        $project: {
                                title: 1,
                                description: 1,
                                thumbnail: 1,
                                createdAt: 1,
                                views: 1,
                                likesCount: 1,
                                commentsCount: 1,
                        },
                },
        ]);

        return res.status(200).json({
                message: "User top videos fetched successfully",
                topViewedVideos,
        });
});

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
        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        const topVideos = await Video.aggregate([
                // 1. Get user's videos
                {
                        $match: {
                                owner: new mongoose.Types.ObjectId(req.user.id),
                        },
                },

                // 2. Find maximum values
                {
                        $group: {
                                _id: null,

                                videos: {
                                        $push: "$$ROOT",
                                },

                                maxViews: {
                                        $max: {
                                                $ifNull: ["$views", 0],
                                        },
                                },

                                maxLikes: {
                                        $max: {
                                                $ifNull: ["$likesCount", 0],
                                        },
                                },

                                maxComments: {
                                        $max: {
                                                $ifNull: ["$commentsCount", 0],
                                        },
                                },
                        },
                },

                // 3. Convert videos array back into documents
                {
                        $unwind: "$videos",
                },

                // 4. Normalize metrics
                {
                        $set: {
                                normalizedViews: {
                                        $divide: [
                                                {
                                                        $ifNull: [
                                                                "$videos.views",
                                                                0,
                                                        ],
                                                },
                                                {
                                                        $max: ["$maxViews", 1],
                                                },
                                        ],
                                },

                                normalizedLikes: {
                                        $divide: [
                                                {
                                                        $ifNull: [
                                                                "$videos.likesCount",
                                                                0,
                                                        ],
                                                },
                                                {
                                                        $max: ["$maxLikes", 1],
                                                },
                                        ],
                                },

                                normalizedComments: {
                                        $divide: [
                                                {
                                                        $ifNull: [
                                                                "$videos.commentsCount",
                                                                0,
                                                        ],
                                                },
                                                {
                                                        $max: [
                                                                "$maxComments",
                                                                1,
                                                        ],
                                                },
                                        ],
                                },
                        },
                },

                // 5. Calculate ranking score
                {
                        $set: {
                                score: {
                                        $round: [
                                                {
                                                        $add: [
                                                                {
                                                                        $multiply: [
                                                                                "$normalizedViews",
                                                                                0.5,
                                                                        ],
                                                                },
                                                                {
                                                                        $multiply: [
                                                                                "$normalizedLikes",
                                                                                0.3,
                                                                        ],
                                                                },
                                                                {
                                                                        $multiply: [
                                                                                "$normalizedComments",
                                                                                0.2,
                                                                        ],
                                                                },
                                                        ],
                                                },
                                                2,
                                        ],
                                },
                        },
                },

                // 6. Highest score first
                {
                        $sort: {
                                score: -1,
                        },
                },

                // 7. Top 5
                {
                        $limit: 5,
                },

                // 8. Return only required fields
                {
                        $project: {
                                _id: "$videos._id",
                                title: "$videos.title",
                                thumbnail: "$videos.thumbnail",
                                views: "$videos.views",
                                likesCount: "$videos.likesCount",
                                commentsCount: "$videos.commentsCount",
                                score: 1,
                        },
                },
        ]);

        return res.status(200).json({
                message: "User top videos fetched successfully",
                topVideos,
        });
});

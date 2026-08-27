import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/Likes.model.js";
import { Comment } from "../models/comments.model.js";
import { Post } from "../models/posts.model.js";
import { pagination } from "../utils/aggreegation/pagination.js";

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
                await Video.findByIdAndUpdate(
                        { _id: videoId },
                        { $inc: { likesCount: -1 } }
                );
        } else {
                await Like.create({
                        video: videoId,
                        likedBy: req.user.id,
                });

                await Video.findByIdAndUpdate(
                        { _id: videoId },
                        { $inc: { likesCount: 1 } }
                );
        }

        return res.status(200).json({ status: "success" });
});

export const toggleCommentLike = catchAsync(async (req, res, next) => {
        const { commentId } = req.params;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const comment = await Comment.exists(
                new mongoose.Types.ObjectId(commentId)
        );

        if (!comment) {
                return next(new ApiError("Comment not found", 404));
        }

        const checkLike = await Like.findOne({
                comment: commentId,
                likedBy: req.user.id,
        });

        if (checkLike) {
                await Like.findByIdAndDelete(checkLike._id);
        } else {
                await Like.create({
                        comment: commentId,
                        likedBy: req.user.id,
                });
        }

        return res.status(200).json({ status: "success" });
});

export const togglePostLike = catchAsync(async (req, res, next) => {
        const { postId } = req.params;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(postId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const post = await Post.exists(new mongoose.Types.ObjectId(postId));

        if (!post) {
                return next(new ApiError("Post not found", 404));
        }

        const checkLike = await Like.findOne({
                post: postId,
                likedBy: req.user.id,
        });

        if (checkLike) {
                await Like.findByIdAndDelete(checkLike._id);
        } else {
                await Like.create({
                        post: postId,
                        likedBy: req.user.id,
                });
        }

        return res.status(200).json({ status: "success" });
});

export const getAllLikedVideos = catchAsync(async (req, res, next) => {
        const { page, limit } = req.validateQuery;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 403));
        }

        const pipeline = [];

        pipeline.push(
                {
                        $match: {
                                likedBy: new mongoose.Types.ObjectId(
                                        req.user.id
                                ),
                        },
                },
                {
                        $lookup: {
                                from: "videos",
                                foreignField: "_id",
                                localField: "video",
                                as: "videos",
                                pipeline: [
                                        {
                                                $lookup: {
                                                        from: "users",
                                                        foreignField: "_id",
                                                        localField: "owner",
                                                        as: "owner",
                                                        pipeline: [
                                                                {
                                                                        $project: {
                                                                                username: 1,
                                                                        },
                                                                },
                                                        ],
                                                },
                                        },

                                        {
                                                $unwind: "$owner",
                                        },

                                        {
                                                $project: {
                                                        title: 1,
                                                        description: 1,
                                                        thumbnail: 1,
                                                        owner: 1,
                                                        createdAt: 1,
                                                        updatedAt: 1,
                                                        views: 1,
                                                },
                                        },
                                ],
                        },
                },

                {
                        $unwind: "$videos",
                },

                {
                        $project: {
                                video: 1,
                                likedBy: 1,
                                videos: 1,
                        },
                }
        );

        pagination({ page, limit, pipeline, totalCount: "totalLikedVideos" });

        const likedVideos = await Like.aggregate(pipeline);

        return res.status(200).json({ status: "success", likedVideos });
});

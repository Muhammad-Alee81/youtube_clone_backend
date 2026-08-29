import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js";
import { Post } from "../models/posts.model.js";
import { pagination } from "../utils/aggreegation/pagination.js";
import { sorting } from "../utils/aggreegation/sorting.js";

export const addComment = catchAsync(async (req, res, next) => {
    const { videoId } = req.params;

    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return next(new ApiError("Invalid Id", 404));
    }

    const video = await Video.findById(videoId);

    if (!video) {
        return next(new ApiError("video not found", 404));
    }

    if (!content) {
        return next(new ApiError("comment content is required", 400));
    }

    const comment = await Comment.create({
        content,
        commentOn: {
            type: "Video",
            id: videoId,
        },
        owner: req.user.id,
    });

    await Video.findByIdAndUpdate(
        { _id: videoId },
        {
            $inc: {
                commentsCount: 1,
            },
        }
    );

    return res.status(201).json({ status: "success", comment });
});

export const replyToComment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return next(new ApiError("Invalid Id", 404));
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        return next(new ApiError("Comment not Found", 404));
    }

    if (!content?.trim()) {
        return next(new ApiError("Comment content is required", 400));
    }

    const childComment = await Comment.create({
        content,
        commentOn: {
            type: comment.commentOn.type,
            id: comment.commentOn.id,
        },
        owner: req.user.id,
        parentComment: comment.parentComment
            ? comment.parentComment
            : comment._id,
        replyTo: comment.owner,
    });

    return res.status(201).json({ childComment });
});

export const updateComment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return next(new ApiError("Invalid Comment Id", 400));
    }

    if (!content?.trim()) {
        return next(new ApiError("comment can not be empty", 400));
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user.id, isDeleted: false },
        { $set: { content } },
        { returnDocument: "after" }
    );

    if (!updatedComment) {
        return next(new ApiError("Comment not Found", 404));
    }

    return res.status(200).json({
        message: "comment updated successfully",
        updatedComment,
    });
});

export const deleteComment = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return next(new ApiError("Invalid Comment Id", 400));
    }

    const deletedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user.id, isDeleted: false },
        { $set: { isDeleted: true, content: "[Comment Deleted]" } },
        { returnDocument: "after" }
    );

    if (!deletedComment) {
        return next(new ApiError("Comment not Found", 404));
    }

    if (deletedComment.commentOn.type !== "Video") {
        return next(new ApiError("Invalid comment target", 400));
    }

    const videoId = deletedComment.commentOn.id;

    const video = await Video.exists({
        _id: videoId,
    });

    if (!video) {
        return next(new ApiError("video not found", 404));
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { commentsCount: -1 } });

    return res.status(200).json({
        message: "comment deleted successfully",
        deletedComment,
    });
});

export const getAllParentComments = catchAsync(async (req, res, next) => {
    const { videoId } = req.params;
    const { page, limit } = req.validateQuery;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const video = await Video.findById(videoId);

    if (!video) {
        return next(new ApiError("video not found", 404));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                commentOn: {
                    type: "Video",
                    id: new mongoose.Types.ObjectId(videoId),
                },
                parentComment: null,
            },
        },

        {
            $sort: {
                createdAt: -1,
            },
        },

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
                            email: 1,
                            fullName: 1,
                        },
                    },
                ],
            },
        },

        {
            $unwind: "$owner",
        },

        {
            $lookup: {
                from: "comments",
                foreignField: "parentComment",
                localField: "_id",
                as: "replies",
            },
        },

        {
            $addFields: {
                replyCount: {
                    $size: "$replies",
                },
            },
        },

        {
            $project: {
                content: 1,
                video: 1,
                isDeleted: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                replyCount: 1,
                parentComment: 1,
                replyCount: 1,
                commentOn: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalComments" });

    const parentComment = await Comment.aggregate(pipeline);

    return res.status(200).json({ status: "success", parentComment });
});

export const getCommentReplies = catchAsync(async (req, res, next) => {
    const { commentId } = req.params;
    const { page, limit } = req.validateQuery;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const checkComment = await Comment.exists({ _id: commentId });

    if (!checkComment) {
        return next(new ApiError("Comment not found", 404));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                parentComment: new mongoose.Types.ObjectId(commentId),
            },
        },

        {
            $sort: {
                createdAt: -1,
            },
        },

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
            $unwind: {
                path: "$owner",
                preserveNullAndEmptyArrays: true,
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "replyTo",
                foreignField: "_id",
                as: "replyTo",
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
            $unwind: {
                path: "$replyTo",
                preserveNullAndEmptyArrays: true,
            },
        },

        {
            $project: {
                content: 1,
                owner: 1,
                parentComment: 1,
                replyTo: 1,
                commentOn: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalReplies" });

    const replies = await Comment.aggregate(pipeline);

    return res.status(200).json({ status: "success", replies });
});

// ------------------------------------------------------------
// Get all Parent coments on Post

/*

postId
validate
user validation

post find karain gay




*/

export const addCommentOnPost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;
    const { content } = req.body;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 403));
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const checkPost = await Post.exists({ _id: postId });

    if (!checkPost) {
        return next(new ApiError("Post not found", 404));
    }

    if (!content) {
        return next(new ApiError("comment content is required", 400));
    }

    const addComment = await Comment.create({
        content,
        commentOn: {
            type: "Post",
            id: postId,
        },
        owner: req.user.id,
    });

    return res.status(201).json({ message: "comment added", addComment });
});

export const getAllParentCommentsOnPost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;

    const { page, limit, sort } = req.validateQuery;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return next(new ApiError("Invalid Id", 400));
    }

    const pipeline = [];
    pipeline.push({
        $match: {
            commentOn: {
                type: "Post",
                id: new mongoose.Types.ObjectId(postId),
            },
            parentComment: null,
        },
    });

    sorting(sort, pipeline);

    pipeline.push(
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
            $lookup: {
                from: "comments",
                foreignField: "parentComment",
                localField: "_id",
                as: "replies",
            },
        },

        {
            $addFields: {
                replyCount: {
                    $size: "$replies",
                },
            },
        },

        {
            $project: {
                content: 1,
                commentOn: 1,
                owner: 1,
                isDeleted: 1,
                createdAt: 1,
                updatedAt: 1,
                replyCount: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalComments" });

    const parentComment = await Comment.aggregate(pipeline);

    return res.status(200).json({ status: "success", comments: parentComment });
});

// get all comments of Authenticated user on his all uploaded videos

export const getRecentCommentsOnVideos = catchAsync(async (req, res, next) => {
    const { page, limit } = req.validateQuery;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 404));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                "commentOn.type": "Video",
                parentComment: null,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },

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
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },

        {
            $unwind: "$owner",
        },

        {
            $lookup: {
                from: "videos",
                let: {
                    contentId: "$commentOn.id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$contentId"] },
                                    {
                                        $eq: [
                                            "$owner",
                                            new mongoose.Types.ObjectId(
                                                req.user.id
                                            ),
                                        ],
                                    },
                                ],
                            },
                        },
                    },

                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            createdAt: 1,
                        },
                    },
                ],
                as: "video",
            },
        },

        {
            $unwind: "$video",
        },

        {
            $project: {
                content: 1,
                owner: 1,
                video: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalComments" });

    const comments = await Comment.aggregate(pipeline);

    return res.status(200).json({ status: "success", comments });
});

export const getRecentCommentsOnPosts = catchAsync(async (req, res, next) => {
    const { page, limit } = req.validateQuery;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 404));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                "commentOn.type": "Post",
                parentComment: null,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },

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
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },

        {
            $unwind: "$owner",
        },

        {
            $lookup: {
                from: "posts",
                let: {
                    contentId: "$commentOn.id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$_id", "$$contentId"] },
                                    {
                                        $eq: [
                                            "$owner",
                                            new mongoose.Types.ObjectId(
                                                req.user.id
                                            ),
                                        ],
                                    },
                                ],
                            },
                        },
                    },

                    {
                        $project: {
                            content: 1,
                            images: 1,
                            createdAt: 1,
                        },
                    },
                ],
                as: "post",
            },
        },
        {
            $unwind: "$post",
        },
        {
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1,
                post: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalComments" });

    const comments = await Comment.aggregate(pipeline);

    return res.status(200).json({ status: "success", comments });
});

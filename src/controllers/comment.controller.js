import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js";
import { Post } from "../models/posts.model.js";

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

        // PAGINATION
        const pageNum = page || 1;
        const limitNum = limit || 10;
        const skip = (pageNum - 1) * limitNum;

        const pipeline = [];

        pipeline.push(
                {
                        $match: {
                                commentOn: {
                                        type: "Video",
                                        id: new mongoose.Types.ObjectId(
                                                videoId
                                        ),
                                },
                                parentComment: null,
                        },
                },

                {
                        $facet: {
                                metaData: [{ $count: "totalComments" }],
                                data: [
                                        {
                                                $sort: {
                                                        createdAt: -1,
                                                },
                                        },

                                        {
                                                $skip: skip,
                                        },
                                        {
                                                $limit: limitNum,
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
                                                        foreignField:
                                                                "parentComment",
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
                                        },
                                ],
                        },
                },

                {
                        $project: {
                                pagination: {
                                        totalComments: {
                                                $ifNull: [
                                                        {
                                                                $arrayElemAt: [
                                                                        "$metaData.totalComments",
                                                                        0,
                                                                ],
                                                        },
                                                        0,
                                                ],
                                        },

                                        result: {
                                                $size: "$data",
                                        },

                                        currentPage: {
                                                $literal: pageNum,
                                        },

                                        pageSize: {
                                                $literal: limitNum,
                                        },

                                        totalPages: {
                                                $ceil: {
                                                        $divide: [
                                                                {
                                                                        $ifNull: [
                                                                                {
                                                                                        $arrayElemAt:
                                                                                                [
                                                                                                        "$metaData.totalComments",
                                                                                                        0,
                                                                                                ],
                                                                                },
                                                                                0,
                                                                        ],
                                                                },
                                                                limitNum,
                                                        ],
                                                },
                                        },
                                },

                                comments: "$data",
                        },
                }
        );

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

        // PAGINATION
        const pageNum = page || 1;
        const limitNum = limit || 5;
        const skip = (pageNum - 1) * limitNum;

        const pipeline = [
                {
                        $match: {
                                parentComment: new mongoose.Types.ObjectId(
                                        commentId
                                ),
                        },
                },

                {
                        $facet: {
                                metaData: [{ $count: "totalReplies" }],
                                data: [
                                        {
                                                $sort: {
                                                        createdAt: -1,
                                                },
                                        },

                                        {
                                                $skip: skip,
                                        },

                                        {
                                                $limit: limitNum,
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
                                        },
                                ],
                        },
                },

                {
                        $project: {
                                pagination: {
                                        totalComments: {
                                                $ifNull: [
                                                        {
                                                                $arrayElemAt: [
                                                                        "$metaData.totalReplies",
                                                                        0,
                                                                ],
                                                        },
                                                        0,
                                                ],
                                        },

                                        result: {
                                                $size: "$data",
                                        },

                                        pageSize: {
                                                $literal: limitNum,
                                        },

                                        currentPage: {
                                                $literal: pageNum,
                                        },

                                        totalPages: {
                                                $ceil: {
                                                        $divide: [
                                                                {
                                                                        $ifNull: [
                                                                                {
                                                                                        $arrayElemAt:
                                                                                                [
                                                                                                        "$metaData.totalReplies",
                                                                                                        0,
                                                                                                ],
                                                                                },
                                                                                0,
                                                                        ],
                                                                },

                                                                limitNum,
                                                        ],
                                                },
                                        },
                                },

                                data: "$data",
                        },
                },
        ];

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

        const { page, limit } = req.validateQuery;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        // PAGINATION
        const pageNum = page || 1;
        const limitNum = limit || 5;
        const skip = (pageNum - 1) * limitNum;

        const parentComment = await Comment.aggregate([
                {
                        $match: {
                                commentOn: {
                                        type: "Post",
                                        id: new mongoose.Types.ObjectId(postId),
                                },
                                parentComment: null,
                        },
                },

                {
                        $facet: {
                                matadata: [
                                        {
                                                $count: "totalComments",
                                        },
                                ],

                                data: [
                                        {
                                                $sort: {
                                                        createdAt: -1,
                                                },
                                        },

                                        {
                                                $skip: skip,
                                        },

                                        {
                                                $limit: limitNum,
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
                                                $unwind: "$owner",
                                        },

                                        {
                                                $lookup: {
                                                        from: "comments",
                                                        foreignField:
                                                                "parentComment",
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
                                        },
                                ],
                        },
                },

                {
                        $project: {
                                pagination: {
                                        totalComments: {
                                                $ifNull: [
                                                        {
                                                                $arrayElemAt: [
                                                                        "$matadata.totalComments",
                                                                        0,
                                                                ],
                                                        },

                                                        0,
                                                ],
                                        },

                                        results: {
                                                $size: "$data",
                                        },
                                        pageSize: {
                                                $literal: limitNum,
                                        },

                                        totalPages: {
                                                $ceil: {
                                                        $divide: [
                                                                {
                                                                        $ifNull: [
                                                                                {
                                                                                        $arrayElemAt:
                                                                                                [
                                                                                                        "$matadata.totalComments",
                                                                                                        0,
                                                                                                ],
                                                                                },
                                                                                0,
                                                                        ],
                                                                },
                                                                limitNum,
                                                        ],
                                                },
                                        },
                                },

                                data: "$data",
                        },
                },
        ]);

        return res
                .status(200)
                .json({ status: "success", comments: parentComment });
});

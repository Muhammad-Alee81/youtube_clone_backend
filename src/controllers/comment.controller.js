import mongoose from "mongoose";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js";

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
                video: videoId,
                owner: req.user.id,
        });

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
                video: comment.video,
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

        return res.status(200).json({
                message: "comment deleted successfully",
                deletedComment,
        });
});

export const getAllParentComments = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("Invalid Id", 400));
        }

        const video = await Video.findById(videoId);

        if (!video) {
                return next(new ApiError("video not found", 404));
        }

        const parentComment = await Comment.aggregate([
                {
                        $match: {
                                video: new mongoose.Types.ObjectId(videoId),
                                parentComment: null,
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
                        $project: {
                                content: 1,
                                video: 1,
                                isDeleted: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                owner: 1,
                        },
                },
        ]);

        if (!parentComment.length) {
                return next(new ApiError("No comment found", 404));
        }

        return res.status(200).json({ status: "success", parentComment });
});

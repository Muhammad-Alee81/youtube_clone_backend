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

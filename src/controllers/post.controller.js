import mongoose from "mongoose";
import { Post } from "../models/posts.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import { sorting } from "../utils/aggreegation/sorting.js";
import { pagination } from "../utils/aggreegation/pagination.js";

const uploadPostImagesOnCloud = async (images) => {
    const result = await Promise.all(
        images.map(async (el) => {
            const res = await uploadOnCloudinary(el.path, "posts", "image");

            return { publicId: res.public_id, url: res.secure_url };
        })
    );

    return result;
};

export const createPost = catchAsync(async (req, res, next) => {
    const { content } = req.body;
    const images = req.files;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 403));
    }

    if (!content) return next(new ApiError("content is required", 400));

    if (images.length > 7) {
        return next(new ApiError("Maximum 7 images Allowed", 400));
    }

    const postImages = images.length
        ? await uploadPostImagesOnCloud(images)
        : [];

    const post = await Post.create({
        content,
        images: postImages,
        owner: req.user.id,
    });

    if (!post) {
        return next(
            new ApiError(
                "something went wrong while creating the post. plz try again",
                500
            )
        );
    }

    return res.status(201).json({ message: "Post created successfully" });
});

export const deletePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return next(new ApiError("Invalid Id", 400));
    }

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 403));
    }

    const deletePost = await Post.findOneAndDelete({
        _id: postId,
        owner: req.user?.id,
    });

    if (!deletePost) {
        return next(new ApiError("post not found", 404));
    }

    await Promise.all(
        deletePost.images.map(async (el) => {
            await cloudinary.uploader.destroy(el.publicId, {
                resource_type: "image",
            });
        })
    );

    return res.status(200).json({ message: "Post deleted", deletePost });
});

export const updatePost = catchAsync(async (req, res, next) => {
    const { postId } = req.params;

    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        return next(new ApiError("Invalid Id", 400));
    }

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 403));
    }

    if (!("content" in req.body)) {
        return next(new ApiError("Nothing to update", 400));
    }

    const updatePost = await Post.findOneAndUpdate(
        {
            _id: postId,
            owner: req.user.id,
        },
        {
            $set: {
                content,
            },
        },
        {
            returnDocument: "after",
        }
    );

    if (!updatePost) {
        return next(new ApiError("Post not found", 404));
    }

    return res
        .status(200)
        .json({ message: "post updated successfully", updatePost });
});

export const getAllPost = catchAsync(async (req, res, next) => {
    const { page, limit } = req.validateQuery;
    const pipeline = [];

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
                            avatar: 1,
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
                images: 1,
                owner: 1,
                createdAt: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalPosts" });

    const posts = await Post.aggregate(pipeline);

    return res.status(200).json({ status: "success", posts });
});

export const myPosts = catchAsync(async (req, res, next) => {
    const { sort, page, limit } = req.validateQuery;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 401));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user.id),
            },
        },
        {
            $project: {
                content: 1,
                images: 1,
                createdAt: 1,
            },
        }
    );

    sorting(sort, pipeline);
    pagination({ page, limit, pipeline, totalCount: "totalPosts" });

    const myPosts = await Post.aggregate(pipeline);

    return res.status(200).json({ status: "success", myPosts });
});

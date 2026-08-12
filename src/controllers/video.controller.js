import { size } from "zod";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import {
        deleteImageFile,
        deletePreviousAvatar,
        deleteVideoFile,
        uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { deleteLocalTempFiles } from "../utils/deleteLocalTempFiles.js";
import mongoose from "mongoose";

export const uploadVideo = catchAsync(async (req, res, next) => {
        const thumbnail = req.files.thumbnail;
        const video = req.files.video;

        if (!req.body.title?.trim()) {
                deleteLocalTempFiles(thumbnail[0].path, video[0].path);
                return next(new ApiError("Title is required", 400));
        }

        if (!req.body.description?.trim()) {
                deleteLocalTempFiles(thumbnail[0].path, video[0].path);
                return next(new ApiError("Description is required", 400));
        }

        if (!thumbnail?.length || !video?.length) {
                return next(
                        new ApiError("thumbnail or video is required", 400)
                );
        }

        const [uploadThumbnail, uploadVideo] = await Promise.all([
                uploadOnCloudinary(thumbnail[0].path, "thumbnails", "image"),
                uploadOnCloudinary(video[0].path, "videos", "video"),
        ]);

        if (!uploadThumbnail || !uploadVideo) {
                return next(new ApiError("upload failed", 500));
        }

        const videoUpload = await Video.create({
                title: req.body.title,
                description: req.body.description,
                thumbnail: {
                        url: uploadThumbnail.secure_url,
                        publicId: uploadThumbnail.public_id,
                },
                videoFile: {
                        url: uploadVideo.secure_url,
                        publicId: uploadVideo.public_id,
                },
                duration: uploadVideo.duration,
                owner: req.user?.id,
        });

        if (!videoUpload) {
                return next(
                        new ApiError(
                                "something went wrong while uploading the video",
                                500
                        )
                );
        }

        return res.status(201).json({
                message: "video uploaded",
                video: videoUpload,
        });
});

export const getAllVideos = catchAsync(async (req, res, next) => {
        const { page, limit, sort, ...filters } = req.validateQuery;

        // ADVANCED FILTERING
        let queryStr = JSON.stringify(filters);

        queryStr = queryStr.replace(
                /\b(gt|lt|lte|gte)\b/g,
                (match) => `$${match}`
        );

        const pipeline = [];

        if (Object.keys(filters).length) {
                pipeline.push({
                        $match: JSON.parse(queryStr),
                });
        }

        // SORTING
        if (sort) {
                const sortFields = sort.split(",");
                const sortObj = {};

                sortFields.forEach((field) => {
                        if (field.startsWith("-")) {
                                sortObj[field.slice(1)] = -1;
                        } else {
                                sortObj[field] = 1;
                        }
                });

                pipeline.push({
                        $sort: sortObj,
                });
        } else {
                pipeline.push({
                        $sort: {
                                createdAt: -1,
                        },
                });
        }

        // PAGINATION
        const pageNum = page || 1;
        const limitNum = limit || 10;
        const skip = (pageNum - 1) * limitNum;

        pipeline.push(
                {
                        $facet: {
                                metadata: [{ $count: "totalVideos" }],

                                data: [
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
                                                $project: {
                                                        title: 1,
                                                        thumbnail: 1,
                                                        videoFile: 1,
                                                        duration: 1,
                                                        owner: 1,
                                                        views: 1,
                                                        createdAt: 1,
                                                },
                                        },
                                ],
                        },
                },
                {
                        $project: {
                                totalVideos: {
                                        $ifNull: [
                                                {
                                                        $arrayElemAt: [
                                                                "$metadata.totalVideos",
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
                                                                $arrayElemAt: [
                                                                        "$metadata.totalVideos",
                                                                        0,
                                                                ],
                                                        },
                                                        limitNum,
                                                ],
                                        },
                                },

                                videos: "$data",
                        },
                }
        );

        const allVideos = await Video.aggregate(pipeline);

        return res.status(200).json({ allVideos });
});

export const getVideoById = catchAsync(async (req, res, next) => {
        const currentUserId = req.user?.id
                ? new mongoose.Types.ObjectId(req.user.id)
                : null;

        if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) {
                return next(new ApiError("incorrect video id", 400));
        }

        const [video] = await Video.aggregate([
                {
                        $match: {
                                _id: new mongoose.Types.ObjectId(
                                        req.params.videoId
                                ),
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
                                                $lookup: {
                                                        from: "subscriptions",
                                                        foreignField: "channel",
                                                        localField: "_id",
                                                        as: "subscribers",
                                                },
                                        },
                                        {
                                                $addFields: {
                                                        subscribersCount: {
                                                                $size: "$subscribers",
                                                        },

                                                        isSubscribed: {
                                                                $cond: {
                                                                        if: currentUserId,
                                                                        then: {
                                                                                $in: [
                                                                                        currentUserId,
                                                                                        "$subscribers.subscriber",
                                                                                ],
                                                                        },
                                                                        else: false,
                                                                },
                                                        },
                                                },
                                        },

                                        {
                                                $project: {
                                                        fullName: 1,
                                                        subscribersCount: 1,
                                                        isSubscribed: 1,
                                                },
                                        },
                                ],
                        },
                },
        ]);

        if (!video) {
                return next(new ApiError("video not found", 404));
        }

        return res.status(200).json({ video });
});

export const updateVideo = catchAsync(async (req, res, next) => {
        const { title, description } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.videoId)) {
                return next(new ApiError("invalid object ID", 400));
        }

        const video = await Video.findById(req.params.videoId);

        if (!video) {
                return next(new ApiError("video not found", 404));
        }

        if (video.owner?.toString() !== req.user?.id) {
                if (req.file?.path) {
                        deleteLocalTempFiles(req.file?.path);
                }

                return next(new ApiError("unauthorized", 403));
        }

        if (req.file) {
                const oldPublicId = video.thumbnail.publicId;
                const updatedThumbnail = await uploadOnCloudinary(
                        req.file?.path,
                        "thumbnails",
                        "image"
                );

                video.thumbnail = {
                        url: updatedThumbnail.secure_url,
                        publicId: updatedThumbnail.public_id,
                };

                await deletePreviousAvatar(oldPublicId);
        }

        if (title) video.title = title;
        if (description) video.description = description;

        const updatedVideo = await video.save();

        return res
                .status(200)
                .json({ message: "video updated successfully", updatedVideo });
});

export const deleteVideo = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("invalid ID", 400));
        }

        const video = await Video.findById(videoId);

        if (!video) {
                return next(new ApiError("video not found", 404));
        }

        if (video?.owner.toString() !== req.user.id) {
                return next(new ApiError("unauthorized", 403));
        }

        await video.deleteOne();

        await deleteImageFile(video?.thumbnail?.publicId);
        await deleteVideoFile(video?.videoFile?.publicId);

        return res
                .status(200)
                .json({ message: "video deleted successfully", video });
});

export const togglePublishStatus = catchAsync(async (req, res, next) => {
        const { videoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(videoId)) {
                return next(new ApiError("invalid ID", 400));
        }

        const video = await Video.findById(videoId);

        if (!video) {
                return next(new ApiError("video not found", 404));
        }

        if (video?.owner?.toString() !== req.user.id) {
                return next(new ApiError("unauthorized", 403));
        }

        video.isPublished = !video.isPublished;

        await video.save();

        return res.status(200).json({
                message: "Video publish status updated successfully",
                video,
        });
});


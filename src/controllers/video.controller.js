import { pipe, size } from "zod";
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
import { advancedFiltering } from "../utils/aggreegation/filtering.js";
import { sorting } from "../utils/aggreegation/sorting.js";
import { pagination } from "../utils/aggreegation/pagination.js";

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

        const pipeline = [];

        advancedFiltering(filters, pipeline);
        sorting(sort, pipeline);

        pipeline.push({
                $project: {
                        title: 1,
                        thumbnail: 1,
                        videoFile: 1,
                        duration: 1,
                        owner: 1,
                        views: 1,
                        createdAt: 1,
                },
        });

        pagination({ page, limit, pipeline, totalCount: "totalVideos" });

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
                {
                        $unwind: "$owner",
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

/*
--------------------------------------------------
DASHBOARD VIDEO PAGE APIS
----------------------------------------------------

PAGINATION:
http://localhost:4000/api/v1/videos/my/videos?page=1&limit=2

FILTERS:
http://localhost:4000/api/v1/videos/my/videos?views[gt]=79

SORTING:(sorting by default newest to oldest video)
http://localhost:4000/api/v1/videos/my/videos?sort=createdAt

PUBLISH STATUS:
http://localhost:4000/api/v1/videos/my/videos?isPublished=false

BY DEFAULT VIDEOS:
http://localhost:4000/api/v1/videos/my/videos


----------------------------------------------------------------------------------
GET MOST VIEWED VIDEOS: (for dashboard overview page)
-----------------------------------------------------------------------------------
http://localhost:4000/api/v1/videos/my/video?ssort=-views&limit=5

GET MOST LIKED VIDEOS
http://localhost:4000/api/v1/videos/my/video?ssort=-likesCount&limit=5

GET MOST Commented VIDEOS
http://localhost:4000/api/v1/videos/my/video?ssort=-commentsCount&limit=5

----------------------------------------------------------------------------------
GET RECENT UPLOADED VIDEOS: (for dashboard overview page)
----------------------------------------------------------------------------------- 
http://localhost:4000/api/v1/videos/my/videos?sort=-createdAt&limit=5


*/

export const myVideos = catchAsync(async (req, res, next) => {
        const { page, limit, sort, ...filters } = req.validateQuery;

        if (!req.user?.id) {
                return next(new ApiError("unauthorized", 401));
        }

        const pipeline = [];

        pipeline.push({
                $match: {
                        owner: new mongoose.Types.ObjectId(req.user.id),
                },
        });

        advancedFiltering(filters, pipeline);
        sorting(sort, pipeline);

        pipeline.push({
                $project: {
                        title: 1,
                        thumbnail: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1,
                        likesCount: 1,
                        commentsCount: 1,
                        isPublished: 1,
                },
        });

        pagination({ page, limit, pipeline, totalCount: "totalVideos" });

        const videos = await Video.aggregate(pipeline);

        return res.status(200).json({ status: "suceess", videos });
});

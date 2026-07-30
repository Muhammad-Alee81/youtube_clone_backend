import { Video } from "../models/video.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteLocalTempFiles } from "../utils/deleteLocalTempFiles.js";

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
              return next(new ApiError("thumbnail or video is required", 400));
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
       const allVideos = await Video.aggregate([
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
       ]);

       return res
              .status(200)
              .json({ data: { length: allVideos.length, allVideos } });
});

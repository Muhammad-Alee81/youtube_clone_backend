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
       }

       // PAGINATION
       const pageNum = page || 1;
       const limitNum = limit || 10;
       const skip = (pageNum - 1) * limitNum;

       pipeline.push({
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
       });

       const allVideos = await Video.aggregate(pipeline);

       return res.status(200).json({ allVideos });
});

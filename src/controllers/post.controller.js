import { Post } from "../models/posts.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadPostImagesOnCloud = async (images) => {
        const result = await Promise.all(
                images.map(async (el) => {
                        const res = await uploadOnCloudinary(
                                el.path,
                                "posts",
                                "image"
                        );

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

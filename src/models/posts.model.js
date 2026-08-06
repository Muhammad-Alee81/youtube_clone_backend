import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
        {
                content: {
                        type: String,
                        required: [true, "post description is required"],
                        trim: true,
                },

                images: [
                        {
                                url: {
                                        type: String,
                                        required: [
                                                true,
                                                "Image url is required",
                                        ],
                                },
                                publicId: {
                                        type: String,
                                        required: [
                                                true,
                                                "Public Id is required",
                                        ],
                                },

                                _id: false,
                        },
                ],

                owner: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                        required: [true, "User is required"],
                },
        },
        { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);


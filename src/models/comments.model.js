import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
        {
                content: {
                        type: String,
                        required: [true, "comment content is required"],
                },

                video: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Video",
                        required: [true, "video Id is required"],
                },

                owner: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                        required: [true, "user  is required"],
                },

                parentComment: {
                        type: mongoose.Schema.ObjectId,
                        ref: "Comment",
                        default: null,
                },

                replyTo: {
                        type: mongoose.Schema.ObjectId,
                        ref: "User",
                        default: null,
                },

                isDeleted: {
                        type: Boolean,
                        default: false,
                },
        },

        { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);

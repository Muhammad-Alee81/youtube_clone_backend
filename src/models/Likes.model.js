import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
        comment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
        },

        video: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
        },

        post: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Post",
        },

        likedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
        },
});

likeSchema.index(
        { likedBy: 1, video: 1, comment: 1, post: 1 },
        { unique: true }
);

export const Like = mongoose.model("Like", likeSchema);

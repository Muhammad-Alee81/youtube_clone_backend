import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
        {
                title: {
                        type: String,
                        required: [true, "title is required"],
                },

                description: {
                        type: String,
                },

                video: [
                        {
                                type: mongoose.Types.ObjectId,
                                ref: "Video",
                        },
                ],

                owner: {
                        type: mongoose.Types.ObjectId,
                        ref: "User",
                },

                visibility: {
                        type: String,
                        enum: ["public", "private"],
                        default: "public",
                },
        },
        { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);

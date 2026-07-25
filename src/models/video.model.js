import mongoose from "mongoose";

/*

videoId
title
description
thumbnail
videoFile
views
owner
isPublished
duration


*/

const videoSchema = new mongoose.Schema(
       {
              title: {
                     type: String,
                     trim: true,
                     required: true,
              },

              description: {
                     type: String,
                     trim: true,
                     required: true,
              },

              thumbnail: {
                     url: String,
                     publicId: String,
              },

              videoFile: {
                     url: String,
                     publicId: String,
              },

              duration: {
                     type: NUmber,
                     required: [true, "video duration is required"],
              },

              owner: {
                     type: mongoose.Schema.ObjectId,
                     ref: "User",
              },
       },

       { timestamps: true }
);

export const Video = mongoose.model("Video", videoSchema);

import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import fs from "fs";
import ApiError from "./api_error.js";

// Configuration
cloudinary.config({
       cloud_name: process.env.CLOUD_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
       api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (
       filePath,
       folderName,
       resourceType = "auto"
) => {
       try {
              const uploadFile = await cloudinary.uploader.upload(filePath, {
                     folder: `youtube-clone/${folderName}`,
                     resource_type: resourceType,
              });

              if (fs.existsSync(filePath)) {
                     fs.unlinkSync(filePath);
              }

              return uploadFile;
       } catch (err) {
              if (fs.existsSync(filePath)) {
                     fs.unlinkSync(filePath);
              }

              throw err;
       }
};

export const deletePreviousAvatar = async (publicId) => {
       await cloudinary.uploader.destroy(publicId);
};

export const deleteImageFile = async (publicId) => {
       const { result } = await cloudinary.uploader.destroy(publicId, {
              resource_type: "image",
       });

       if (result !== "ok") {
              throw new ApiError("Failed to delete file", 500);
       }
};
export const deleteVideoFile = async (publicId) => {
       const { result } = await cloudinary.uploader.destroy(publicId, {
              resource_type: "video",
       });

       if (result !== "ok") {
              throw new ApiError("Failed to delete file", 500);
       }
};

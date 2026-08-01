import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";

export const createPlaylist = catchAsync(async (req, res, next) => {
        const { title, description, visibility } = req.body;

        if (!title) {
                return next(new ApiError("title is required", 400));
        }

        if (!req.user) {
                return next(new ApiError("unauthorized", 403));
        }

        const playlist = await Playlist.create({
                title,
                description: description || "",
                owner: req.user?.id,
        });

        return res.status(201).json({ message: "playlist created", playlist });
});

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
       {
              username: {
                     type: String,
                     lowercase: true,
                     required: [true, "username is required"],
                     index: true,
                     trim: true,
              },

              fullName: {
                     type: String,
                     // required: [true, "full name is required"],
                     index: true,
              },

              email: {
                     type: String,
                     required: [true, "username is required"],
                     unique: true,
                     lowercase: true,
                     trim: true,
              },

              password: {
                     type: String,
                     required: [true, "password is required"],
                     select: false,
              },

              avatar: {
                     url: String,
                     publicId: String,
              },

              coverImage: {
                     url: String,
                     publicId: String,
              },

              watchHistory: [
                     {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "Video",
                     },
              ],

              refreshToken: {
                     type: String,
              },
       },
       { timestamps: true }
);

// HASH PASSWORD
userSchema.pre("save", async function () {
       if (!this.isModified("password")) return;
       const hashPassword = await bcrypt.hash(this.password, 10);
       this.password = hashPassword;
});

//COMPARE PASSWORD WITH HASH PASSWORD
userSchema.methods.comparePassword = async function (password) {
       return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
       return jwt.sign(
              {
                     id: this._id,
                     usename: this.username,
                     email: this.email,
                     fullName: this.fullName,
              },
              process.env.ACCESS_TOKEN_SECRET,
              {
                     expiresIn: "1d",
              }
       );
};

userSchema.methods.generateRefreshToken = function () {
       return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
              expiresIn: "7d",
       });
};

export const User = mongoose.model("User", userSchema);

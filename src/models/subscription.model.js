import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
       {
              //one who is subscribing
              subscriber: {
                     type: mongoose.Schema.Types.ObjectId,
                     ref: "User",
              },

              //one who is getting subscribed
              channel: {
                     type: mongoose.Schema.Types.ObjectId,
                     ref: "User",
              },
       },
       { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);





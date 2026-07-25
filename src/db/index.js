import mongoose from "mongoose";

export const dataBaseConnection = async () => {
       try {
              await mongoose.connect(process.env.DATABASE_URL);
              console.log("DATABASE CONNECTED");
       } catch (err) {
              console.log("DATABASE ERROR: ", err);
       }
};

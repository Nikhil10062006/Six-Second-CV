import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

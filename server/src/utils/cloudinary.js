import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import "dotenv/config";
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadOnCloud = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const uploadedPdf = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      access_mode: "public", // FIX: ensures CORS-friendly public delivery
      folder: "resumes",
    });

    console.log("Uploaded to Cloudinary:", uploadedPdf.url);
    fs.unlinkSync(localFilePath);
    return { url: uploadedPdf.url, publicId: uploadedPdf.public_id };
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    fs.unlinkSync(localFilePath);
    return null;
  }
};
export { uploadOnCloud };

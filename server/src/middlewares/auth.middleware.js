// middleware/verifyJWT.js
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.models.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    throw new ApiError(401, "Access token not found");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken",
  );
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  next();
});

export default verifyJWT;

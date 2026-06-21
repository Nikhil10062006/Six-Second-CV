import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
const generateAccessTokenAndRefreshToken = async (user) => {
  try {
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.log(error.message);
    throw new ApiError(400, "Access and refresh Token generation failed");
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (
    !username ||
    !email ||
    !password ||
    username === "" ||
    email === "" ||
    password === ""
  ) {
    throw new ApiError(404, "All fields are required");
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(400, "A user with this username already exists");
  }

  const newUser = await User.create({
    username,
    email,
    password,
  });
  if (!newUser) {
    throw new ApiError(400, "User Registrations failed");
  }

  const registeredUser = {
    username: newUser.username,
    email: newUser.email,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, "User Registered Successfully", registeredUser));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || email === "" || password === "") {
    throw new ApiError(404, "All the fields are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(
      400,
      "User with the required mail address doent exist .Please register first ",
    );
  }

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) {
    throw new ApiError(400, "Incorrect Password.Please try again");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  const loggedInUser = {
    username: user.username,
    email: user.email,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        loggedInUser,
        accessToken,
      }),
    );
});

export const getUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched Successfully", req.user));
});

export const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { refreshToken: null } },
    { new: true },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(404, "Refresh Tokens cannot be found");
  }

  let decodedToken;
  try {
    decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch (error) {
    throw new ApiError(401, "Refresh Token is not valid");
  }
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(
      404,
      "User with the specific refreshToken cannot be found",
    );
  }
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(404, "Refresh token mismatch");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  const refreshedUser = {
    username: user.username,
    email: user.email,
  };
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Access Tokens refreshed successfully", {
        refreshedUser,
        accessToken,
      }),
    );
});

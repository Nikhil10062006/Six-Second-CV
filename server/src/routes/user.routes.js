import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  getUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";

import verifyJWT from "../middlewares/auth.middleware.js";

const userRouter = Router();
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.post("/logout", verifyJWT, logOutUser);
userRouter.get("/me", verifyJWT, getUser);

export default userRouter;

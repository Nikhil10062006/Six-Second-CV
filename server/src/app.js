import express from "express";
import cors from "cors";
import cookieparser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import resumeRouter from "./routes/resume.routes.js";
import jobPostingRouter from "./routes/jobPosting.routes.js";
import outreachRouter from "./routes/outReach.routes.js";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieparser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/jobposting", jobPostingRouter);
app.use("/api/v1/coldreach", outreachRouter);

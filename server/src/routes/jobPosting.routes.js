import { Router } from "express";
import {
  postJob,
  getJobPosting,
  deleteJobPosting,
  allJobsWithSameResume,
} from "../controllers/jobposting.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const jobPostingRouter = Router();
jobPostingRouter.use(verifyJWT);
jobPostingRouter.get("/resume/:resumeId", allJobsWithSameResume);
jobPostingRouter.post("/", postJob);
jobPostingRouter.get("/:jobId", getJobPosting);
jobPostingRouter.delete("/:jobId", deleteJobPosting);

export default jobPostingRouter;

// routes/resume.routes.js
import { Router } from "express";
import {
  uploadResume,
  getResume,
  deleteResume,
  atsVisuals,
  heatMap,
  getAllResumes,
  getResumePdfProxy,
} from "../controllers/resume.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const resumeRouter = Router();
resumeRouter.use(verifyJWT);

resumeRouter.get("/pdf-proxy/:resumeId", getResumePdfProxy);
resumeRouter.post("/upload", upload.single("resume"), uploadResume);
resumeRouter.get("/", getAllResumes);
resumeRouter.get("/:resumeId", getResume);
resumeRouter.delete("/:resumeId", deleteResume);
resumeRouter.get("/:resumeId/ats", atsVisuals);
resumeRouter.get("/:resumeId/heatmap", heatMap);

export default resumeRouter;

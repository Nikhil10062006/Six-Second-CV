import { Router } from "express";
import {
  scrapeCompany,
  generate,
  saveDraft,
  getDraftsList,
  getDraft,
  getDraftByCompany,
  updateVariant,
  regenerateVariant,
  deleteDraft,
} from "../controllers/outreach.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const outReachRouter = Router();

outReachRouter.use(verifyJWT);
outReachRouter.post("/scrape-company", scrapeCompany);
outReachRouter.post("/generate", generate);
outReachRouter.post("/drafts", saveDraft);
outReachRouter.get("/drafts/lookup", getDraftByCompany); 
outReachRouter.get("/drafts/:userId/:draftId", getDraft);
outReachRouter.get("/drafts/:userId", getDraftsList);
outReachRouter.patch("/drafts/:draftId", updateVariant);
outReachRouter.post("/drafts/:draftId/regenerate", regenerateVariant); 
outReachRouter.delete("/drafts/:draftId", deleteDraft);

export default outReachRouter;

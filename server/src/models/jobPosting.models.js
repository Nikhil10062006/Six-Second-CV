import mongoose from "mongoose";

const gapSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["missingSkill", "weakPhrasing", "rewriteSuggestion"],
      default: "missingSkill",
    },
    skill: { type: String, required: true },
    detail: { type: String, default : "" },
    suggestion: { type: String, default : "" },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    toImprove: {
      type: String,
      enum: ["mustHave", "niceToHave"],
      required: true, // FIX: was `reuired` — typo silently ignored by Mongoose, field was never required
      default: "mustHave",
    },
  },
  { _id: false },
);

const sectionScoreSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true },
    requirementSkill: { type: String, required: true },
    similarity: { type: Number, required: true },
    type: {
      type: String,
      enum: ["niceToHave", "mustHave"],
      default: "mustHave",
    },
    atsText: {
      type: String,
      default: null, // FIX: was `deafult` — typo silently ignored by Mongoose
    },
  },
  { _id: false },
);

const skillEmbeddingSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    embedding: { type: [Number], default: [] },
  },
  { _id: false },
);

const jobPostingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    sourceType: {
      type: String,
      enum: ["url", "text"],
      required: true,
    },
    sourceUrl: { type: String, default: null },
    rawText: { type: String, required: true },
    companyName: { type: String, default: null },
    jobTitle: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "analyzed", "failed"],
      default: "pending",
    },
    parseError: { type: String, default: null },
    requirements: {
      mustHave: [skillEmbeddingSchema],
      niceToHave: [skillEmbeddingSchema],
    },
    matchScore: { type: Number, default: 0 },
    sectionScores: [sectionScoreSchema],
    gaps: [gapSchema],
  },
  { timestamps: true },
);

export const JobPosting = mongoose.model("JobPosting", jobPostingSchema);

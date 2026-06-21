import mongoose from "mongoose";

const gapSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["missingSkill", "weakPhrasing", "rewriteSuggestion"],
      default: "missingSkill",
    },
    skill: { type: String, required: true },
    detail: { type: String, required: true },
    suggestion: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
  },
  { _id: false },
);

const jobListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    team: { type: String, default: null },
    stack: [{ type: String }],
    url: { type: String, default: null },
  },
  { _id: false },
);

const stackOverlapSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    foundInResume: { type: Boolean, default: false },
    foundInJD: { type: Boolean, default: false },
    similarityScore: { type: Number, default: 0 },
  },
  { _id: false },
);

const scrapingMetaSchema = new mongoose.Schema(
  {
    errors: { type: [String], default: [] },
    timestamp: { type: String, default: null },
    usedHNFallback: { type: Boolean, default: false },
  },
  { _id: false },
);

const recentActivityItemSchema = new mongoose.Schema(
  {
    headline: { type: String, default: null },
    url: { type: String, default: null },
    publishedAt: { type: String, default: null },
  },
  { _id: false },
);

const suggestedRoleSchema = new mongoose.Schema(
  {
    title: { type: String, default: null },
    team: { type: String, default: null },
    url: { type: String, default: null },
    matchedSkills: [{ type: String }],
  },
  { _id: false },
);

const companySignalsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: null },
    hiringSignals: [jobListingSchema],
    recentActivity: [recentActivityItemSchema],
    stackOverlap: [stackOverlapSchema],
    suggestedRoles: [suggestedRoleSchema],
    gapList: [gapSchema],
    resumeHighlights: [{ type: mongoose.Schema.Types.Mixed }],
    scrapingMeta: { type: scrapingMetaSchema, default: null },
    targetRole: { type: mongoose.Schema.Types.Mixed, default: null }, // NEW: Saves the selected role
  },
  { _id: false },
);

// NEW — snapshot of a previous generation, pushed here each time regenerate runs
const variantHistoryEntrySchema = new mongoose.Schema(
  {
    subject: { type: String, default: null },
    content: { type: String, required: true },
    context: { type: String, default: null }, // the personal context the user supplied for that regeneration, if any
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema({
  role: { type: String, default: "General Outreach" },
  channel: { type: String, enum: ["linkedin", "email"], required: true },
  subject: { type: String, default: null },
  content: { type: String, required: true }, // always the LATEST AI-generated version
  editedContent: { type: String, default: null }, // user's manual overlay on top of `content`
  status: {
    type: String,
    enum: ["draft", "sent", "responded", "archived"],
    default: "draft",
  }, // NEW — moved to per-variant, see note below
  history: [variantHistoryEntrySchema], // NEW — prior generations, oldest first
  generatedAt: { type: Date, default: Date.now },
});

const outreachDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobPostingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      default: null,
    },
    companyName: { type: String, required: true },
    companySignals: { type: companySignalsSchema, default: null },
    gapsAddressed: [gapSchema],
    variants: [variantSchema],
    selectedVariantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: {
      type: String,
      enum: ["draft", "sent", "responded", "archived"],
      default: "draft",
    },
    notes: { type: String, default: null }, // left in schema, no longer surfaced in UI per your decision
  },
  { timestamps: true },
);

export const OutreachDraft = mongoose.model(
  "OutreachDraft",
  outreachDraftSchema,
);

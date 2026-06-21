import { JobPosting } from "../models/jobPosting.models.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { callLlama } from "../config/llama.js";
import { callNvidia } from "../config/nv-embed-qa.js";
import { Resume } from "../models/resume.models.js";
import { scraperClient } from "../config/scrapeClient.js";
import * as cheerio from "cheerio";

export const postJob = asyncHandler(async (req, res) => {
  const { resumeId, sourceType } = req.body;

  if (!resumeId || !sourceType) {
    throw new ApiError(400, "resumeId and sourceType are required");
  }

  let rawText = null;

  if (sourceType === "url") {
    if (!req.body.sourceUrl) throw new ApiError(400, "sourceUrl is required");
    try {
      const { data } = await scraperClient.get(req.body.sourceUrl);
      const $ = cheerio.load(data);
      $("script, style, nav, footer, header").remove();
      rawText = $("body").text().replace(/\s+/g, " ").trim();
    } catch {
      throw new ApiError(400, "Failed to scrape the provided URL");
    }
  } else if (sourceType === "text") {
    if (!req.body.rawText) throw new ApiError(400, "rawText is required");
    rawText = req.body.rawText;
  } else {
    throw new ApiError(400, "sourceType must be 'url' or 'text'");
  }

  const jobPosting = await JobPosting.create({
    resumeId,
    sourceType,
    sourceUrl: req.body.sourceUrl || null,
    rawText,
    status: "pending",
  });

  const extractPrompt = `Extract the company name, job title, must-have skills, and nice-to-have skills from the job description below.
Return ONLY a JSON object with exactly these fields: companyName, jobTitle, mustHave (array of strings), niceToHave (array of strings).
No explanation, no markdown, no extra text.

Job Description:
${rawText}`;

  const rawLLMResponse = await callLlama(extractPrompt);

  let parsed;
  try {
    const cleaned = rawLLMResponse.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ApiError(500, "AI skill extraction response could not be parsed");
  }

  const mustHave = [];
  for (const skill of parsed.mustHave) {
    const embedding = await callNvidia(skill, "query");
    mustHave.push({ skill, embedding });
  }

  const niceToHave = [];
  for (const skill of parsed.niceToHave) {
    const embedding = await callNvidia(skill, "query");
    niceToHave.push({ skill, embedding });
  }

  const resume = await Resume.findById(resumeId).select("sections");
  if (!resume) throw new ApiError(404, "Resume not found");

  for (const section of resume.sections) {
    if (!section.embedding || !section.embedding.length) {
      section.embedding = await callNvidia(section.atsText, "query");
    }
  }
  // FIX: embeddings were computed in memory but never persisted — every subsequent
  // JD match re-computed them. Save once here so they're reused across all matches.
  await resume.save();

  const cosineSimilarity = (vecA, vecB) => {
    const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  };

  const sectionScores = [];

  for (const { skill, embedding } of mustHave) {
    for (const section of resume.sections) {
      const similarity = cosineSimilarity(section.embedding, embedding);
      sectionScores.push({
        sectionName: section.name,
        atsText: section.atsText,
        requirementSkill: skill,
        similarity,
        type: "mustHave",
      });
    }
  }

  for (const { skill, embedding } of niceToHave) {
    for (const section of resume.sections) {
      const similarity = cosineSimilarity(section.embedding, embedding);
      sectionScores.push({
        sectionName: section.name,
        atsText: section.atsText,
        requirementSkill: skill,
        similarity,
        type: "niceToHave",
      });
    }
  }

  const gaps = [];

  const getSkillMax = (skill, type) => {
    const relevant = sectionScores.filter(
      (s) => s.requirementSkill === skill && s.type === type,
    );
    return relevant.reduce(
      (best, s) => (s.similarity > best.similarity ? s : best),
      relevant[0],
    );
  };

  let mustMatchScore = 0;
  for (const { skill } of mustHave) {
    const best = getSkillMax(skill, "mustHave");
    mustMatchScore += best.similarity > 0.5 ? 1.0 : best.similarity;

    if (best.similarity <= 0.5) {
      const gapPrompt = `You are an experienced HR manager. The skill "${skill}" appears weak or missing in this resume section:
"${best.atsText}"

Return ONLY a JSON object with these fields:
- type: one of "missingSkill", "rewriteSuggestion", "weakPhrasing"
- detail: why this skill is weak or missing (1-2 sentences)
- suggestion: how to improve it (1-2 sentences)
- severity: one of "high", "medium", "low"

No explanation, no markdown, no extra text.`;

      const gapRaw = await callLlama(gapPrompt);
      let gapParsed;
      try {
        gapParsed = JSON.parse(gapRaw.replace(/```json|```/g, "").trim());
      } catch {
        throw new ApiError(500, "AI gap analysis response could not be parsed");
      }

      gaps.push({
        skill,
        type: gapParsed.type || "missingSkill",
        detail:
          gapParsed.detail ||
          gapParsed.reason ||
          gapParsed.description ||
          "No detail provided",
        suggestion:
          gapParsed.suggestion ||
          gapParsed.recommendation ||
          gapParsed.fix ||
          "No suggestion provided",
        severity: ["high", "medium", "low"].includes(gapParsed.severity)
          ? gapParsed.severity
          : "medium",
        toImprove: "mustHave", // or "niceToHave"
      });
    }
  }

  let niceMatchScore = 0;
  for (const { skill } of niceToHave) {
    const best = getSkillMax(skill, "niceToHave");
    niceMatchScore += best.similarity > 0.5 ? 1.0 : best.similarity;

    if (best.similarity <= 0.5) {
      const gapPrompt = `You are an experienced HR manager. The skill "${skill}" appears weak or missing in this resume section:
"${best.atsText}"

Return ONLY a JSON object with these fields:
- type: one of "missingSkill", "rewriteSuggestion", "weakPhrasing"
- detail: why this skill is weak or missing (1-2 sentences)
- suggestion: how to improve it (1-2 sentences)
- severity: one of "high", "medium", "low"

No explanation, no markdown, no extra text.`;

      const gapRaw = await callLlama(gapPrompt);
      let gapParsed;
      try {
        gapParsed = JSON.parse(gapRaw.replace(/```json|```/g, "").trim());
      } catch {
        throw new ApiError(500, "AI gap analysis response could not be parsed");
      }

      gaps.push({
        skill,
        type: gapParsed.type || "missingSkill",
        detail:
          gapParsed.detail ||
          gapParsed.reason ||
          gapParsed.description ||
          "No detail provided",
        suggestion:
          gapParsed.suggestion ||
          gapParsed.recommendation ||
          gapParsed.fix ||
          "No suggestion provided",
        severity: ["high", "medium", "low"].includes(gapParsed.severity)
          ? gapParsed.severity
          : "medium",
        toImprove: "niceToHave", // or "niceToHave"
      });
    }
  }

  const matchScore =
    (0.7 * mustMatchScore) / mustHave.length +
    (0.3 * niceMatchScore) / (niceToHave.length || 1);

  jobPosting.companyName = parsed.companyName;
  jobPosting.jobTitle = parsed.jobTitle;
  // FIX: was `jobPosting.mustHave` / `jobPosting.niceToHave` — those paths don't exist
  // on the schema. The schema nests them under `requirements`. Saves were silently dropped.
  jobPosting.requirements = { mustHave, niceToHave };
  jobPosting.sectionScores = sectionScores;
  jobPosting.gaps = gaps;
  jobPosting.matchScore = parseFloat(matchScore.toFixed(3));
  jobPosting.status = "analyzed";
  await jobPosting.save();

  return res.status(201).json(
    new ApiResponse(201, "Job posting analyzed successfully", {
      _id: jobPosting._id,
      status: jobPosting.status,
    }),
  );
});

export const getJobPosting = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(400, "Job Id extraction failed");
  }

  // FIX: was `findById` with no select, so the full doc — including
  // requirements.mustHave[].embedding and requirements.niceToHave[].embedding —
  // went straight to the frontend. Exclude both vector arrays at the query level.
  const jobPosting = await JobPosting.findById(jobId).select(
    "-requirements.mustHave.embedding -requirements.niceToHave.embedding",
  );
  if (!jobPosting) {
    throw new ApiError(404, "Job with the specific job id cannot be found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Job fetched successfully", jobPosting));
});

export const deleteJobPosting = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    throw new ApiError(400, "Job Id extraction failed");
  }

  const jobPosting = await JobPosting.findByIdAndDelete(jobId);
  if (!jobPosting) {
    throw new ApiError(
      404,
      "Job with the specific job id cannot be found or is already deleted",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Job deleted successfully", {}));
});

export const allJobsWithSameResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) {
    throw new ApiError(400, "Resume ID extraction failed");
  }

  // Already clean — only ever selects summary fields, no embeddings touched.
  const jobs = await JobPosting.find({ resumeId }).select(
    "_id companyName jobTitle matchScore status createdAt",
  );
  if (!jobs.length) {
    throw new ApiError(404, "No jobs found for this resume");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Jobs fetched successfully", jobs));
});

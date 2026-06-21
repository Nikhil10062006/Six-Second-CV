import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import * as cheerio from "cheerio";
import { Resume } from "../models/resume.models.js";
import { JobPosting } from "../models/jobPosting.models.js";
import { OutreachDraft } from "../models/outReachDraft.js";
import { scraperClient } from "../config/scrapeClient.js";
import { callLlama } from "../config/llama.js";
import { callNvidia } from "../config/nv-embed-qa.js";
import mongoose from "mongoose";

const { isObjectIdOrHexString } = mongoose;

async function scrapeCareersPage(companyName, careersUrl) {
  let bodyText = null;
  try {
    const { data } = await scraperClient.get(careersUrl, { timeout: 10000 });
    const $ = cheerio.load(data);
    $("script, style, nav, footer, header").remove();
    bodyText = $("body").text().replace(/\s+/g, " ").trim();
  } catch {}

  const isEmptyScrape = !bodyText || bodyText.length < 600;

  if (!isEmptyScrape) {
    const prompt = `Extract job listings from the careers page of ${companyName}.
Raw page text: """${bodyText.slice(0, 8000)}"""
Respond ONLY with a valid JSON array. Each element must have exactly these fields:
{ "title": "string", "team": "string", "stack": ["string"], "url": "string or null" }
For url: only include it if you can see the EXACT full URL in the page text. If not visible, use null.
No markdown, no explanation, just the JSON array.`;

    try {
      const llmResponse = await callLlama(prompt);
      const cleaned = llmResponse.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const companyDomain = new URL(careersUrl).hostname
        .replace("www.", "")
        .split(".")[0]
        .toLowerCase();

      const validated = parsed.map((job) => ({
        ...job,
        url:
          job.url &&
          job.url.startsWith("http") &&
          job.url.toLowerCase().includes(companyDomain)
            ? job.url
            : null,
      }));

      if (validated.length >= 2) return validated;
    } catch {}
  }

  try {
    const { data } = await scraperClient.get(
      `https://www.themuse.com/api/public/jobs?company=${encodeURIComponent(companyName)}&page=0&descending=true`,
      { timeout: 8000 },
    );

    const jobs = (data.results || []).slice(0, 15);
    if (!jobs.length) throw new Error("No TheMuse results");

    const jobSummaries = jobs
      .map(
        (j, i) =>
          `${i + 1}. Title: "${j.name}" | Team: "${j.categories?.[0]?.name || "General"}" | URL: "${j.refs?.landing_page || null}" | Description: "${j.contents?.replace(/<[^>]+>/g, "").slice(0, 300) || ""}..."`,
      )
      .join("\n");

    const prompt = `Extract structured job listings from these entries for ${companyName}.
${jobSummaries}
Respond ONLY with a valid JSON array. Each element:
{ "title": "string", "team": "string", "stack": ["string"], "url": "string or null" }
For url: copy it exactly from the entry above, do not modify it.
For stack: infer from the description and title. Be specific (e.g. "React" not "frontend").
No markdown, no explanation.`;

    const llmResponse = await callLlama(prompt);
    const cleaned = llmResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new ApiError(
      502,
      `Both careers scrape and TheMuse fallback failed: ${err.message}`,
    );
  }
}

async function scrapeRecentActivity(companyName) {
  const thirtyDaysAgo = Math.floor(
    (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000,
  );

  const parseActivityWithLlm = async (rawText) => {
    const prompt = `Extract posts published in the last 30 days from this company blog text.
Raw text: """${rawText}"""
Respond ONLY with a valid JSON array. Each element: { "headline": "string", "url": "string", "publishedAt": "ISO date string" }
No markdown, no explanation.`;

    const llmResponse = await callLlama(prompt);
    const cleaned = llmResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  };

  const candidateUrls = [
    `https://${companyName}.com/blog`,
    `https://${companyName}.com/engineering`,
  ];

  for (const url of candidateUrls) {
    try {
      const { data } = await scraperClient.get(url, { timeout: 8000 });
      const $ = cheerio.load(data);
      $("script, style, nav, footer, header").remove();
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();
      const parsed = await parseActivityWithLlm(bodyText);
      return { source: url, posts: parsed, usedHNFallback: false };
    } catch {}
  }

  try {
    const { data } = await scraperClient.get(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(companyName)}&tags=story&numericFilters=created_at_i>${thirtyDaysAgo}`,
    );

    const posts = (data.hits || []).slice(0, 10).map((hit) => ({
      headline: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      publishedAt: hit.created_at,
    }));

    return { source: "hn_algolia", posts, usedHNFallback: true };
  } catch (error) {
    throw new ApiError(502, `All activity sources failed: ${error.message}`);
  }
}

function makeEmbeddingCache() {
  const cache = new Map();
  return async (skill) => {
    if (cache.has(skill)) return cache.get(skill);
    const embedding = await callNvidia(skill, "query");
    cache.set(skill, embedding);
    return embedding;
  };
}

const cosineSimilarity = (vecA, vecB) => {
  const dot = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

const MATCH_THRESHOLD = 0.75;

async function buildStackOverlap(detectedStack, resumeSections, getEmbedding) {
  const overlap = await Promise.all(
    detectedStack.map(async (skill) => {
      const skillEmbedding = await getEmbedding(skill);

      let bestScore = 0;
      for (const section of resumeSections) {
        const score = cosineSimilarity(skillEmbedding, section.embedding);
        if (score > bestScore) bestScore = score;
      }

      return {
        skill,
        foundInJD: true,
        foundInResume: bestScore >= MATCH_THRESHOLD,
        similarityScore: bestScore,
      };
    }),
  );

  return overlap.sort((a, b) => b.similarityScore - a.similarityScore);
}

export const scrapeCompany = asyncHandler(async (req, res) => {
  const { companyName, careersUrl, resumeId, jobPostingId } = req.body;

  if (!companyName || !resumeId) {
    throw new ApiError(400, "companyName and resumeId are required");
  }

  const resume = await Resume.findById(resumeId).select("sections");
  if (!resume) throw new ApiError(404, "Resume not found");

  let gapList = [];
  if (jobPostingId) {
    const jobPosting = await JobPosting.findById(jobPostingId).select("gaps");
    if (!jobPosting) throw new ApiError(404, "Job posting not found");
    gapList = jobPosting.gaps || [];
  }

  const scrapingMeta = { errors: [], timestamp: new Date().toISOString() };
  const careersTarget = careersUrl || `https://${companyName}.com/careers`;

  const [careersResultRaw, activityResult] = await Promise.all([
    scrapeCareersPage(companyName, careersTarget).catch((err) => {
      scrapingMeta.errors.push(`careers: ${err.message}`);
      return null;
    }),
    scrapeRecentActivity(companyName).catch((err) => {
      scrapingMeta.errors.push(`activity: ${err.message}`);
      return null;
    }),
  ]);

  const MAX_ROLES = 20;
  let careersResult = careersResultRaw;
  if (careersResult && careersResult.length > MAX_ROLES) {
    scrapingMeta.rolesTruncated = true;
    scrapingMeta.totalRolesFound = careersResult.length;
    careersResult = careersResult.slice(0, MAX_ROLES);
  }

  if (activityResult?.usedHNFallback) {
    scrapingMeta.usedHNFallback = true;
  }

  const getEmbedding = makeEmbeddingCache();

  let stackOverlap = [];
  let suggestedRoles = [];

  if (careersResult) {
    const allStack = [...new Set(careersResult.flatMap((l) => l.stack || []))];

    if (allStack.length) {
      stackOverlap = await buildStackOverlap(
        allStack,
        resume.sections || [],
        getEmbedding,
      ).catch((err) => {
        scrapingMeta.errors.push(`stackOverlap: ${err.message}`);
        return [];
      });
    }

    const suggestionResults = await Promise.all(
      careersResult.map(async (listing) => {
        const listingStack = [...new Set(listing.stack || [])];
        if (!listingStack.length) return null;

        const overlap = await buildStackOverlap(
          listingStack,
          resume.sections || [],
          getEmbedding,
        ).catch(() => []);
        const strongMatches = overlap.filter((s) => s.foundInResume);
        if (!strongMatches.length) return null;

        return {
          title: listing.title,
          team: listing.team,
          url: listing.url,
          matchedSkills: strongMatches.map((s) => s.skill),
        };
      }),
    );

    suggestedRoles = suggestionResults.filter(Boolean);
  }

  const companySignals = {
    companyName,
    hiringSignals: careersResult || [],
    recentActivity: activityResult?.posts || [],
    stackOverlap,
    suggestedRoles,
    gapList,
    // FIX: Map sections to omit giant embeddings that crash the UI/Network payload
    resumeHighlights: (resume.sections || []).map((s) => ({
      name: s.name,
      atsText: s.atsText,
    })),
    scrapingMeta,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Company signals scraped successfully",
        companySignals,
      ),
    );
});

export const generate = asyncHandler(async (req, res) => {
  const {
    resumeId,
    jobPostingId,
    companyName,
    companySignals,
    targetRole: userSelectedRole,
  } = req.body;

  if (!resumeId || !companyName) {
    throw new ApiError(400, "resumeId and companyName are required");
  }
  if (!jobPostingId && !companySignals) {
    throw new ApiError(
      400,
      "Either jobPostingId or companySignals is required",
    );
  }

  const resume = await Resume.findById(resumeId).select("sections");
  if (!resume) throw new ApiError(404, "Resume not found");

  // FIX: Strip vector embeddings so we don't blow up the LLM token limit (400 Token Error)
  const cleanSections = resume.sections.map((s) => ({
    name: s.name,
    atsText: s.atsText,
  }));

  let gaps = [];
  let signalsBlock = null;

  if (jobPostingId) {
    const jobPosting = await JobPosting.findById(jobPostingId).select("gaps");
    if (!jobPosting) throw new ApiError(404, "Job posting not found");
    gaps = jobPosting.gaps || [];
  }

  if (companySignals) {
    signalsBlock = companySignals;
    gaps = companySignals.gapList || gaps;
  }

  // FIX: Delete duplicate data before stringifying to save tokens
  let cleanSignals = null;
  if (signalsBlock) {
    cleanSignals = { ...signalsBlock };
    delete cleanSignals.resumeHighlights;
    delete cleanSignals.scrapingMeta;
  }

  const promptContext = `Resume highlights (what the user is strong at):
${JSON.stringify(cleanSections, null, 2)}

${gaps.length ? `Gap list (what is missing or weak in the resume for this role):\n${JSON.stringify(gaps, null, 2)}\n` : ""}
${cleanSignals ? `Company signals (hiring teams, recent news, stack overlap):\n${JSON.stringify(cleanSignals, null, 2)}\n` : `Target company: ${companyName}`}`;

  const targetRole =
    userSelectedRole ||
    signalsBlock?.suggestedRoles?.[0] ||
    signalsBlock?.hiringSignals?.[0] ||
    null;

  const prompt = `Your task is to generate 2 outreach message variants for a job applicant reaching out to ${companyName}.

${promptContext}
${targetRole ? `\nTarget role to write toward specifically:\n${JSON.stringify(targetRole, null, 2)}\n` : ""}

  Instructions:
- Variant 1: LinkedIn DM — short, under 150 words.
- Variant 2: Email — include a subject line.
${signalsBlock ? "- Open both with the most recent company activity as a hook.\n- Lead with the strongest stack overlap skill." : "- Lead with the resume's strongest relevant highlight."}
${gaps.length ? "- Proactively address the top gap from the gap list." : ""}
- Avoid em-dashes and smart quotes in message content.

Respond with a single JSON object matching exactly this schema:
{ "variants": [{ "channel": "linkedin" | "email", "subject": "string or null", "content": "string" }] }`;

  function extractJsonBlock(raw) {
    let cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) cleaned = cleaned.substring(start, end + 1);
    return cleaned;
  }

  function tryParseVariants(raw) {
    const cleaned = extractJsonBlock(raw);
    try {
      return JSON.parse(cleaned);
    } catch {
      const repaired = cleaned.replace(/(?<!\\)\n/g, "\\n");
      return JSON.parse(repaired);
    }
  }

  let parsed;
  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const llmResponse = await callLlama(prompt, {
        jsonMode: true,
        temperature: 0.4,
      });
      parsed = tryParseVariants(llmResponse);
      if (!parsed?.variants || !Array.isArray(parsed.variants)) {
        throw new Error("Response missing variants array");
      }
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!parsed) {
    throw new ApiError(
      500,
      `LLM generate response could not be parsed as JSON after retry: ${lastError?.message}`,
    );
  }

  // FIX: Attach the role directly to the variants before sending to frontend
  const roleTitle = targetRole ? targetRole.title : "General Outreach";
  const variantsWithRole = parsed.variants.map((v) => ({
    ...v,
    role: roleTitle,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "AI variants generated successfully",
        variantsWithRole,
      ),
    );
});

export const saveDraft = asyncHandler(async (req, res) => {
  const {
    userId,
    resumeId,
    jobPostingId,
    companyName,
    companySignals,
    variants,
    gapsAddressed,
  } = req.body;

  if (!userId || !resumeId || !companyName || !variants) {
    throw new ApiError(
      400,
      "userId, resumeId, companyName, and variants are required",
    );
  }

  // FIX: match query now includes jobPostingId (normalized to null when
  // absent). Previously matched only { userId, resumeId, companyName },
  // so outreach to the same company from two different job postings
  // would overwrite each other's draft instead of creating separate ones.
  const draft = await OutreachDraft.findOneAndUpdate(
    { userId, resumeId, companyName, jobPostingId: jobPostingId || null },
    {
      $set: {
        resumeId,
        jobPostingId: jobPostingId || null,
        companySignals: companySignals || null,
        variants,
        gapsAddressed: gapsAddressed || [],
        status: "draft",
      },
    },
    { upsert: true, new: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Draft saved successfully", draft));
});

export const getDraftsList = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  const drafts = await OutreachDraft.find({ userId })
    .sort({ updatedAt: -1 })
    .select("companyName status updatedAt variants resumeId")
    .populate("resumeId", "originalFileName");

  const lean = drafts.map((d) => ({
    _id: d._id,
    companyName: d.companyName,
    status: d.status,
    updatedAt: d.updatedAt,
    variantCount: d.variants?.length ?? 0,
    resumeName: d.resumeId?.originalFileName || "Unknown Resume",
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Drafts fetched successfully", lean));
});

export const getDraft = asyncHandler(async (req, res) => {
  const { userId, draftId } = req.params;

  if (!userId || !draftId) {
    throw new ApiError(400, "userId and draftId are required");
  }
  if (!isObjectIdOrHexString(userId) || !isObjectIdOrHexString(draftId)) {
    throw new ApiError(400, "Invalid ObjectId");
  }

  const draft = await OutreachDraft.findOne({ _id: draftId, userId });
  if (!draft) {
    throw new ApiError(404, "Draft not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Draft fetched successfully", draft));
});

export const updateVariant = asyncHandler(async (req, res) => {
  const { selectedVariantId, status, editedContent } = req.body;
  const { draftId } = req.params;

  if (!draftId) throw new ApiError(400, "draftId is required");
  if (!isObjectIdOrHexString(draftId))
    throw new ApiError(400, "Invalid draftId");
  if (!selectedVariantId || !isObjectIdOrHexString(selectedVariantId)) {
    throw new ApiError(400, "Invalid or missing selectedVariantId");
  }

  const setFields = {};
  if (status !== undefined) setFields["variants.$.status"] = status;
  if (editedContent !== undefined)
    setFields["variants.$.editedContent"] = editedContent;

  if (Object.keys(setFields).length === 0) {
    throw new ApiError(400, "Nothing to update");
  }

  const updatedDraft = await OutreachDraft.findOneAndUpdate(
    { _id: draftId, "variants._id": selectedVariantId },
    { $set: setFields },
    { new: true },
  );

  if (!updatedDraft) throw new ApiError(404, "Draft or variant not found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Variant updated successfully", updatedDraft));
});

export const deleteDraft = asyncHandler(async (req, res) => {
  const { draftId } = req.params;
  const userId = req.user?._id;

  if (!userId || !draftId) {
    throw new ApiError(400, "draftId and authenticated userId are required");
  }
  if (!isObjectIdOrHexString(draftId)) {
    throw new ApiError(400, "Invalid draftId");
  }

  const deletedDraft = await OutreachDraft.findOneAndDelete({
    _id: draftId,
    userId,
  });

  if (!deletedDraft) {
    throw new ApiError(404, "Draft not found or does not belong to this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Draft deleted successfully", {}));
});

export const regenerateVariant = asyncHandler(async (req, res) => {
  const { draftId } = req.params;
  const { selectedVariantId, context } = req.body; // REMOVED targetRole

  if (!isObjectIdOrHexString(draftId)) {
    throw new ApiError(400, "Invalid draftId");
  }
  if (!selectedVariantId || !isObjectIdOrHexString(selectedVariantId)) {
    throw new ApiError(400, "Invalid or missing selectedVariantId");
  }

  const draft = await OutreachDraft.findById(draftId);
  if (!draft) throw new ApiError(404, "Draft not found");

  const targetVariant = draft.variants.id(selectedVariantId);
  if (!targetVariant)
    throw new ApiError(404, "Variant not found in this draft");

  // FIX: Extract the role from the variant itself!
  const variantRole = targetVariant.role || "General Outreach";

  const resume = await Resume.findById(draft.resumeId).select("sections");
  if (!resume) throw new ApiError(404, "Resume not found");

  // FIX: Strip vector embeddings so we don't blow up the LLM token limit
  const cleanSections = resume.sections.map((s) => ({
    name: s.name,
    atsText: s.atsText,
  }));

  let gaps = draft.gapsAddressed || [];
  if (draft.jobPostingId) {
    const jobPosting = await JobPosting.findById(draft.jobPostingId).select(
      "gaps",
    );
    if (jobPosting) gaps = jobPosting.gaps || gaps;
  }

  // FIX: Delete duplicate and junk data before stringifying to save tokens
  let cleanSignals = null;
  if (draft.companySignals) {
    cleanSignals = draft.companySignals.toObject
      ? draft.companySignals.toObject()
      : JSON.parse(JSON.stringify(draft.companySignals));
    delete cleanSignals.resumeHighlights;
    delete cleanSignals.scrapingMeta;
  }

  const prompt = `Your task is to REGENERATE a single outreach message variant for a job applicant reaching out to ${draft.companyName}.

Channel: ${targetVariant.channel}

Previous version of this message (for tone/reference, write a fresh version, don't just lightly edit):
${targetVariant.content}

Resume highlights:
${JSON.stringify(cleanSections, null, 2)}

${gaps.length ? `Gap list:\n${JSON.stringify(gaps, null, 2)}\n` : ""}
${cleanSignals ? `Company signals:\n${JSON.stringify(cleanSignals, null, 2)}\n` : ""}
${variantRole !== "General Outreach" ? `\nTarget role to write toward specifically:\n${variantRole}\n` : ""}
${context ? `IMPORTANT — additional context from the user for this regeneration, prioritize this:\n"""${context}"""\n` : ""}

Instructions:
- ${targetVariant.channel === "email" ? "Include a subject line." : "Keep it under 150 words, no subject line needed."}
- Avoid em-dashes and smart quotes in message content.
- If user context above mentions time passed or no response, adjust tone accordingly (e.g. polite follow-up rather than cold open).

Respond with a single JSON object matching exactly this schema:
{ "subject": "string or null", "content": "string" }`;

  function extractJsonBlock(raw) {
    let cleaned = raw.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) cleaned = cleaned.substring(start, end + 1);
    return cleaned;
  }

  function tryParse(raw) {
    const cleaned = extractJsonBlock(raw);
    try {
      return JSON.parse(cleaned);
    } catch {
      const repaired = cleaned.replace(/(?<!\\)\n/g, "\\n");
      return JSON.parse(repaired);
    }
  }

  let parsed;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const llmResponse = await callLlama(prompt, {
        jsonMode: true,
        temperature: 0.5,
      });
      parsed = tryParse(llmResponse);
      if (!parsed?.content) throw new Error("Response missing content field");
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!parsed) {
    throw new ApiError(
      500,
      `Regeneration could not be parsed: ${lastError?.message}`,
    );
  }

  targetVariant.history.push({
    subject: targetVariant.subject,
    content: targetVariant.content,
    context: context || null,
    generatedAt: new Date(),
  });
  targetVariant.subject = parsed.subject ?? targetVariant.subject;
  targetVariant.content = parsed.content;
  targetVariant.editedContent = null;
  targetVariant.generatedAt = new Date();
  await draft.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Variant regenerated successfully", draft));
});

export const getDraftByCompany = asyncHandler(async (req, res) => {
  const { resumeId, companyName, jobPostingId } = req.query;
  if (!resumeId || !companyName) {
    throw new ApiError(400, "resumeId and companyName are required");
  }
  // FIX: was matching only { userId, resumeId, companyName } — the same
  // resume reaching out to the same company from two different job postings
  // would collide and return the wrong draft. jobPostingId now scopes the
  // lookup, normalized to null when absent so the standalone /coldreach
  // flow (which never carries a jobPostingId) keeps matching its own
  // null-scoped drafts correctly.
  const draft = await OutreachDraft.findOne({
    userId: req.user._id,
    resumeId,
    companyName,
    jobPostingId: jobPostingId || null,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Draft lookup complete", draft || null));
});

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { Resume } from "../models/resume.models.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import axios from "axios";

// FIX 3 & 4: Tightened patterns, removed "languages" from other, added hyphenated extra-curricular
const SECTION_PATTERNS = {
  summary:
    /^[^a-zA-Z]*(summary|objective|profile|about me|professional summary|career objective|professional profile)\b/i,
  experience:
    /^[^a-zA-Z]*(experience|work experience|employment|work history|professional experience|employment history|internship|internships)\b/i,
  education:
    /^[^a-zA-Z]*(education|academics|educational background|academic background|qualifications|coursework)\b/i,
  skills:
    /^[^a-zA-Z]*(skills|technical skills|core competencies|technologies|tech stack|key skills|areas of expertise|programming)\b/i,
  projects:
    /^[^a-zA-Z]*(projects|personal projects|academic projects|portfolio|key projects|relevant projects)\b/i,
  leadership:
    /^[^a-zA-Z]*(leadership|leadership experience|extracurricular|extra-curricular|activities|community|volunteering)\b/i,
  achievements:
    /^[^a-zA-Z]*(achievements|accomplishments|awards|honors|recognition)\b/i,
  certifications:
    /^[^a-zA-Z]*(certifications|certificates|licenses|credentials)\b/i,
  other:
    /^[^a-zA-Z]*(references|interests|hobbies|volunteer|publications|others)\b/i,
};

function detectColumnBoundary(items, pageWidth) {
  if (!items.length || !pageWidth) return null;

  const RESOLUTION = 2;
  const numBuckets = Math.ceil(pageWidth / RESOLUTION);
  const occupied = new Uint8Array(numBuckets);

  const MAX_COL_WIDTH = pageWidth * 0.5;

  // FIX 1: Ignore the top 120 units (the header/contact info).
  // If we don't, centered contact info blocks the vertical gutter detector.
  const colItems = items.filter(
    ({ width, y }) => (width || 0) <= MAX_COL_WIDTH && y > 120,
  );
  if (colItems.length < 5) return null;

  colItems.forEach(({ x, width }) => {
    const start = Math.max(0, Math.floor(x / RESOLUTION));
    const end = Math.min(
      numBuckets - 1,
      Math.floor((x + (width || 8)) / RESOLUTION),
    );
    for (let b = start; b <= end; b++) occupied[b] = 1;
  });

  const lo = Math.floor(numBuckets * 0.1);
  const hi = Math.ceil(numBuckets * 0.9);

  const gaps = [];
  let runStart = -1,
    runLen = 0;

  for (let i = lo; i <= hi; i++) {
    if (!occupied[i]) {
      if (runStart === -1) runStart = i;
      runLen++;
    } else {
      if (runLen >= 5) gaps.push({ start: runStart, len: runLen }); // 10 unit gap is enough
      runStart = -1;
      runLen = 0;
    }
  }
  if (runLen >= 5) gaps.push({ start: runStart, len: runLen });
  if (!gaps.length) return null;

  gaps.sort((a, b) => b.len - a.len);

  // Allow asymmetric columns (at least 5% of content on the side)
  const minSide = colItems.length * 0.05;

  for (const gap of gaps) {
    const gapMid = (gap.start + gap.len / 2) * RESOLUTION;
    const leftCount = colItems.filter((i) => i.x < gapMid).length;
    const rightCount = colItems.filter((i) => i.x >= gapMid).length;
    if (leftCount >= minSide && rightCount >= minSide) return gapMid;
  }
  return null;
}

function buildSectionsFromItems(items) {
  const lines = [];
  items.forEach((item) => {
    const existing = lines.find(
      (l) =>
        Math.abs(l.y - item.y) <= 6 &&
        // FIX 2: Reduce x-merge threshold from 200 to 40. Stops left/right text from merging into one string.
        Math.abs(l.lastX + (l.lastWidth || 0) - item.x) <= 40,
    );

    if (existing) {
      const space =
        item.x - (existing.lastX + existing.lastWidth) > 2 ? " " : "";
      existing.text += space + item.text;
      existing.lastX = item.x;
      existing.lastWidth = item.width;
    } else {
      lines.push({
        y: item.y,
        text: item.text,
        page: item.page,
        lastX: item.x,
        lastWidth: item.width,
      });
    }
  });

  const sections = [];

  // Initialize with 'contact' to catch the top of the resume safely
  let currentSection = {
    name: "contact",
    atsText: "",
    foundInVisual: true,
    foundInAts: true,
    visualOrder: 0,
    atsOrder: 0,
    embedding: null,
  };

  lines.forEach((line) => {
    const lineText = line.text.trim();
    let matchedType = null;

    for (const [type, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(lineText)) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      if (currentSection && currentSection.atsText.trim().length > 0) {
        currentSection.atsText = currentSection.atsText.trim();
        sections.push(currentSection);
      }
      currentSection = {
        name: matchedType,
        atsText: "",
        foundInVisual: true,
        foundInAts: true,
        visualOrder: 0,
        atsOrder: 0,
        embedding: null,
      };
    } else {
      currentSection.atsText += lineText + " ";
    }
  });

  if (currentSection && currentSection.atsText.trim().length > 0) {
    currentSection.atsText = currentSection.atsText.trim();
    sections.push(currentSection);
  }

  return sections;
}

function detectSections(allItems, pageWidth) {
  const boundary = detectColumnBoundary(allItems, pageWidth);

  const sortByY = (a, b) => {
    const yDiff = a.y - b.y;
    return Math.abs(yDiff) > 5 ? yDiff : a.x - b.x;
  };

  if (boundary !== null) {
    // FIX 1 cont: Parse the top 120px as a normal single column header, then split everything below it into columns.
    const headerItems = allItems.filter((i) => i.y < 120).sort(sortByY);
    const bodyItems = allItems.filter((i) => i.y >= 120);

    const leftItems = bodyItems.filter((i) => i.x < boundary).sort(sortByY);
    const rightItems = bodyItems.filter((i) => i.x >= boundary).sort(sortByY);

    const headerSections = buildSectionsFromItems(headerItems);
    const leftSections = buildSectionsFromItems(leftItems);
    const rightSections = buildSectionsFromItems(rightItems);

    return [...headerSections, ...leftSections, ...rightSections].map(
      (s, i) => ({
        ...s,
        visualOrder: i,
        atsOrder: i,
      }),
    );
  }

  return buildSectionsFromItems(allItems.sort(sortByY)).map((s, i) => ({
    ...s,
    visualOrder: i,
    atsOrder: i,
  }));
}

export const uploadResume = asyncHandler(async (req, res) => {
  const { originalname, path } = req.file;
  if (!originalname || !path) {
    throw new ApiError(400, "PDF file is required");
  }

  let pages = [];
  let allItems = [];

  try {
    const fileBuffer = fs.readFileSync(path);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) })
      .promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });

      const pageData = {
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        textItems: [],
      };

      textContent.items.forEach((item) => {
        if (item.str.trim() === "") return;

        const textItem = {
          text: item.str,
          x: item.transform[4],
          y: viewport.height - item.transform[5],
          width: item.width,
          height: item.height,
          fontSize: Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2),
          fontName:
            textContent.styles[item.fontName]?.fontFamily || item.fontName,
          page: i,
        };

        pageData.textItems.push(textItem);
        allItems.push(textItem);
      });

      pages.push(pageData);
    }
  } catch (err) {
    throw new ApiError(400, `PDF parsing failed: ${err.message}`);
  }

  // Pure ATS order (interleaved, scramble effect)
  const atsSortedItems = [...allItems].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 5) return yDiff;
    return a.x - b.x;
  });

  const atsOrderBlocks = atsSortedItems.map((item, index) => ({
    text: item.text,
    page: item.page,
    x: item.x,
    y: item.y,
    order: index,
  }));

  const atsOrderText = atsSortedItems.map((item) => item.text).join(" ");

  const pageWidth = pages[0]?.width ?? 595;
  const sections = detectSections(allItems, pageWidth);

  // NOTE: uploadOnCloud() already unlinks the local temp file on both
  // success and failure internally — nothing is left on disk after this call.
  const cloudResult = await uploadOnCloud(path);
  if (!cloudResult) {
    throw new ApiError(400, "PDF upload to Cloudinary failed");
  }

  const createdResume = await Resume.create({
    originalFileName: originalname,
    storagePath: cloudResult.url,
    userId: req.user._id,
    cloudinaryPublicId: cloudResult.publicId,
    status: "parsed",
    pages,
    atsOrderBlocks,
    atsOrderText,
    sections,
  });

  // FIX: strip embeddings before sending the created doc back — none exist yet at
  // this point (they're populated later during JD match), but excluding here too
  // keeps this response consistent with every other Resume response in this file.
  const safeResume = createdResume.toObject();
  safeResume.sections = safeResume.sections.map(
    ({ embedding, ...rest }) => rest,
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Resume uploaded and parsed successfully",
        safeResume,
      ),
    );
});

export const getResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) throw new ApiError(404, "Resume Id not found");

  // FIX: embeddings were previously included on the full document fetch —
  // exclude the vector field at the query level.
  const resume = await Resume.findById(resumeId).select("-sections.embedding");
  if (!resume) throw new ApiError(404, "Resume not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, "Resume fetched successfully", resume));
});

export const deleteResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const resume = await Resume.findByIdAndDelete(resumeId);
  if (!resume) throw new ApiError(404, "Resume doesn't exist");

  await cloudinary.uploader.destroy(resume.cloudinaryPublicId, {
    resource_type: "raw",
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Resume deleted successfully", {}));
});

export const atsVisuals = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) throw new ApiError(404, "Resume Id not found");

  // FIX: was selecting "sections" whole, which still carried sections[].embedding.
  // Exclude the vector field explicitly.
  const resumeATS = await Resume.findById(resumeId).select(
    "atsOrderText atsOrderBlocks sections -sections.embedding",
  );
  if (!resumeATS) throw new ApiError(404, "Resume not found");

  return res
    .status(200)
    .json(new ApiResponse(200, "ATS Details fetched successfully", resumeATS));
});

export const heatMap = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  if (!resumeId) throw new ApiError(404, "Resume Id not found");

  const resumeDoc = await Resume.findById(resumeId).select("pages status");
  if (!resumeDoc) throw new ApiError(404, "Resume not found");
  if (resumeDoc.status !== "parsed")
    throw new ApiError(400, "Resume has not been parsed yet");

  const W_POSITION = 0.25;
  const W_FONTSIZE = 0.2;
  const W_BOLD = 0.15;
  const W_ZONE = 0.15;
  const W_NUMBERS = 0.1;
  const W_DENSITY = 0.15;

  let maxFontSize = 0;
  resumeDoc.pages.forEach((page) => {
    page.textItems.forEach((item) => {
      maxFontSize = Math.max(maxFontSize, item.fontSize);
    });
  });

  const arr = [];

  resumeDoc.pages.forEach((page) => {
    page.textItems.forEach((item) => {
      let score = 0;

      const normalized_y = 1 - item.y / page.height;
      score += W_POSITION * normalized_y;

      const normalized_fontSize =
        maxFontSize > 0 ? item.fontSize / maxFontSize : 0;
      score += W_FONTSIZE * normalized_fontSize;

      const isBold = /bold|black|heavy|semibold/i.test(item.fontName || "");
      score += isBold ? W_BOLD : 0;

      const normalized_x = item.x / page.width;
      const inZone = normalized_x <= 0.2 || normalized_x >= 0.8;
      score += inZone ? W_ZONE : 0;

      const hasNumbers = /\d/.test(item.text);
      score += hasNumbers ? W_NUMBERS : 0;

      let neighborCount = 0;
      page.textItems.forEach((neighbor) => {
        if (
          neighbor !== item &&
          Math.abs(neighbor.x - item.x) <= 20 &&
          Math.abs(neighbor.y - item.y) <= 20
        ) {
          neighborCount++;
        }
      });
      const normalized_density =
        neighborCount / Math.max(1, page.textItems.length);
      score += W_DENSITY * (1 - normalized_density);

      arr.push({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        page: page.pageNumber,
        score: parseFloat(score.toFixed(3)),
        reason: {
          yScore: parseFloat((W_POSITION * normalized_y).toFixed(3)),
          fontScore: parseFloat((W_FONTSIZE * normalized_fontSize).toFixed(3)),
          boldBonus: isBold,
          zoneBonus: inZone,
          numberBonus: hasNumbers,
          densityScore: parseFloat(
            (W_DENSITY * (1 - normalized_density)).toFixed(3),
          ),
        },
      });
    });
  });

  const COVERAGE = 0.75;
  arr.sort((a, b) => b.score - a.score);
  const cutoffIdx = Math.floor(arr.length * COVERAGE);
  arr.forEach((block, i) => {
    if (i >= cutoffIdx) block.score = 0;
  });

  const pages = resumeDoc.pages.map((p) => ({
    pageNumber: p.pageNumber,
    width: p.width,
    height: p.height,
  }));

  return res.status(200).json(
    new ApiResponse(200, "Resume HeatMap generated successfully", {
      blocks: arr,
      pages,
    }),
  );
});

export const getAllResumes = asyncHandler(async (req, res) => {
  // Already clean — only ever selected these 3 fields, never touched sections.
  const resumes = await Resume.find({ userId: req.user._id })
    .select("originalFileName status createdAt")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Resumes fetched successfully", resumes));
});

// MOVED: was inline in resume.routes.js. Routes should only declare routes —
// this is the actual proxy handler now living with the rest of the resume logic.
export const getResumePdfProxy = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.resumeId).select(
    "storagePath",
  );
  if (!resume) throw new ApiError(404, "Resume not found");

  const response = await axios.get(resume.storagePath, {
    responseType: "stream",
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Access-Control-Allow-Origin", "*");
  response.data.pipe(res);
});

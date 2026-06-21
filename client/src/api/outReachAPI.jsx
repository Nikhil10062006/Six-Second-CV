import { axiosInstance } from "./axiosInstance.jsx";

export const scrapeCompanyDetails = (
  companyName,
  careersUrl,
  resumeId,
  jobPostingId,
) => {
  return axiosInstance.post("/coldreach/scrape-company", {
    companyName,
    careersUrl,
    resumeId,
    jobPostingId,
  });
};

export const generateDrafts = (
  resumeId,
  companyName,
  { jobPostingId, companySignals, targetRole } = {},
) => {
  return axiosInstance.post("/coldreach/generate", {
    resumeId,
    companyName,
    ...(jobPostingId ? { jobPostingId } : {}),
    ...(companySignals ? { companySignals } : {}),
    ...(targetRole ? { targetRole } : {}),
  });
};

export const saveDraft = (
  userId,
  resumeId,
  jobPostingId,
  companyName,
  companySignals,
  variants,
  gapsAddressed,
) => {
  return axiosInstance.post("/coldreach/drafts", {
    userId,
    resumeId,
    jobPostingId,
    companyName,
    companySignals,
    variants,
    gapsAddressed,
  });
};

// FIX: now threads jobPostingId through so the lookup is scoped per
// (resume, company, job) instead of just (resume, company).
export const getDraftByCompany = (resumeId, companyName, jobPostingId) => {
  return axiosInstance.get("/coldreach/drafts/lookup", {
    params: { resumeId, companyName, jobPostingId: jobPostingId || undefined },
  });
};

export const getDraft = (userId, draftId) => {
  return axiosInstance.get(`/coldreach/drafts/${userId}/${draftId}`);
};

export const getDraftsList = (userId) => {
  return axiosInstance.get(`/coldreach/drafts/${userId}`);
};

export const updateVariants = (
  draftId,
  selectedVariantId,
  status,
  editedContent,
) => {
  return axiosInstance.patch(`/coldreach/drafts/${draftId}`, {
    selectedVariantId,
    status,
    editedContent,
  });
};

// FIX: Reverted to just Context. The variant remembers its own role.
export const regenerateVariant = (draftId, selectedVariantId, context) => {
  return axiosInstance.post(`/coldreach/drafts/${draftId}/regenerate`, {
    selectedVariantId,
    context,
  });
};

export const deleteDraft = (draftId) => {
  return axiosInstance.delete(`/coldreach/drafts/${draftId}`);
};

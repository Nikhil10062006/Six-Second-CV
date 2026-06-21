import { useState, createContext, useCallback } from "react";
import {
  scrapeCompanyDetails,
  generateDrafts,
  saveDraft,
  getDraft,
  getDraftsList,
  getDraftByCompany,
  updateVariants,
  regenerateVariant,
  deleteDraft,
} from "../api/outReachAPI.jsx";

export const OutReachContext = createContext();

export default function OutReachProvider({ children }) {
  const [draft, setDraft] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [error, setError] = useState(null);
  const [companySignals, setCompanySignals] = useState(null);
  const [variants, setVariants] = useState([]);

  function resetOutreachState() {
    setCompanySignals(null);
    setVariants([]);
    setDraft(null);
    setError(null);
  }

  async function handleScrapeDetails(
    companyName,
    careersUrl,
    resumeId,
    jobPostingId,
  ) {
    setLoading(true);
    setError(null);
    try {
      const fetchedCompanySignals = await scrapeCompanyDetails(
        companyName,
        careersUrl,
        resumeId,
        jobPostingId,
      );
      setCompanySignals(fetchedCompanySignals.data.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateVariants(
    resumeId,
    companyName,
    { jobPostingId, companySignals, targetRole } = {},
  ) {
    setLoading(true);
    setError(null);
    try {
      const generatedDrafts = await generateDrafts(resumeId, companyName, {
        jobPostingId,
        companySignals,
        targetRole,
      });
      if (generatedDrafts?.data?.data) {
        const newVariants = generatedDrafts.data.data;
        setCompanySignals((prev) => ({ ...prev, targetRole }));
        setVariants((prev) => [...(prev || []), ...newVariants]);
        return newVariants;
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDrafts(
    userId,
    resumeId,
    jobPostingId,
    companyName,
    companySignals,
    variantsToSave,
    gapsAddressed,
  ) {
    setLoading(true);
    setError(null);
    try {
      const savedDraft = await saveDraft(
        userId,
        resumeId,
        jobPostingId,
        companyName,
        companySignals,
        variantsToSave,
        gapsAddressed,
      );
      if (savedDraft) {
        const data = savedDraft.data.data;
        setDraft((prev) => ({ ...prev, ...data }));
        setVariants(() => data.variants);
        return data;
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // FIX: now accepts and forwards jobPostingId so the lookup is scoped per
  // (resume, company, job) instead of just (resume, company).
  async function handleCheckExistingDraft(resumeId, companyName, jobPostingId) {
    try {
      const res = await getDraftByCompany(resumeId, companyName, jobPostingId);
      const found = res.data.data;
      if (found) {
        setDraft(found);
        setVariants(found.variants);
      }
      return found;
    } catch {
      return null;
    }
  }

  async function handleGetDraft(userId, draftId) {
    setLoading(true);
    setError(null);
    try {
      const fetchedDraft = await getDraft(userId, draftId);
      if (fetchedDraft) setDraft(fetchedDraft.data.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetAllDrafts(userId) {
    setLoading(true);
    setError(null);
    try {
      const fetchedDrafts = await getDraftsList(userId);
      if (fetchedDrafts) setDrafts(fetchedDrafts.data.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDraft(draftId) {
    setLoading(true);
    try {
      await deleteDraft(draftId);
      setDraft(null);
      setDrafts((prev) => prev.filter((d) => d._id !== draftId));
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  const patchVariantInDraft = useCallback(
    (updatedDraftFromServer, variantId) => {
      setDraft((prev) => {
        if (!prev) return updatedDraftFromServer;
        const updatedVariant = updatedDraftFromServer.variants?.find(
          (v) => v._id === variantId,
        );
        if (!updatedVariant) return updatedDraftFromServer;
        return {
          ...prev,
          companySignals: updatedDraftFromServer.companySignals,
          updatedAt: updatedDraftFromServer.updatedAt,
          variants: prev.variants.map((v) =>
            v._id === variantId ? updatedVariant : v,
          ),
        };
      });
    },
    [],
  );

  async function handleUpdateVariants(
    draftId,
    selectedVariantId,
    status,
    editedContent,
  ) {
    try {
      const updatedDraft = await updateVariants(
        draftId,
        selectedVariantId,
        status,
        editedContent,
      );
      if (updatedDraft)
        patchVariantInDraft(updatedDraft.data.data, selectedVariantId);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  }

  async function handleRegenerateVariant(draftId, selectedVariantId, context) {
    setRegeneratingId(selectedVariantId);
    try {
      const updatedDraft = await regenerateVariant(
        draftId,
        selectedVariantId,
        context,
      );
      if (updatedDraft)
        patchVariantInDraft(updatedDraft.data.data, selectedVariantId);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setRegeneratingId(null);
    }
  }

  return (
    <OutReachContext.Provider
      value={{
        draft,
        drafts,
        loading,
        regeneratingId,
        error,
        companySignals,
        variants,
        resetOutreachState,
        handleScrapeDetails,
        handleGenerateVariants,
        handleSaveDrafts,
        handleCheckExistingDraft,
        handleGetDraft,
        handleGetAllDrafts,
        handleDeleteDraft,
        handleUpdateVariants,
        handleRegenerateVariant,
      }}
    >
      {children}
    </OutReachContext.Provider>
  );
}

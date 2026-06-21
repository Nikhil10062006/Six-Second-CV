import { useState, createContext } from "react";
import {
  uploadResume,
  getResume,
  deleteResume,
  getAtsVisuals,
  getHeatMap,
} from "../api/resumeAPI.jsx";

export const ResumeContext = createContext();

export default function ResumeProvider({ children }) {
  const [resume, setResume] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [arr, setArr] = useState([]);
  // Page dimensions returned alongside heatmap blocks — keeps HeatmapOverlay
  // self-sufficient without needing a separate getResume call.
  const [heatmapPages, setHeatmapPages] = useState([]);

  async function handleUploadCV(cv) {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadResume(cv);
      setResume(res.data.data);
      return true;
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleGetCV(resumeId) {
    setLoading(true);
    setError(null);
    try {
      const res = await getResume(resumeId);
      setResume(res.data.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCV(resumeId) {
    setLoading(true);
    setError(null);
    try {
      await deleteResume(resumeId);
      setResume(null);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetCVHeatMap(resumeId) {
    setLoading(true);
    setError(null);
    try {
      const res = await getHeatMap(resumeId);
      // Controller now returns { blocks, pages } — blocks are the scored items,
      // pages are { pageNumber, width, height } needed to scale canvas coordinates.
      const { blocks, pages } = res.data.data;
      if (blocks?.length > 0) setArr(blocks);
      if (pages?.length > 0) setHeatmapPages(pages);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetATSVisuals(resumeId) {
    setLoading(true);
    setError(null);
    try {
      const res = await getAtsVisuals(resumeId);
      const fetchedResumeATSContents = res.data.data;
      if (fetchedResumeATSContents) {
        setResume((prev) => ({
          ...prev,
          atsOrderText: fetchedResumeATSContents.atsOrderText,
          atsOrderBlocks: fetchedResumeATSContents.atsOrderBlocks,
          sections: fetchedResumeATSContents.sections,
        }));
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResumeContext.Provider
      value={{
        resume,
        loading,
        error,
        arr,
        heatmapPages,
        handleUploadCV,
        handleGetCV,
        handleGetATSVisuals,
        handleDeleteCV,
        handleGetCVHeatMap,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

import { axiosInstance } from "./axiosInstance.jsx";
export const uploadResume = (resume) => {
  const formData = new FormData();
  formData.append("resume", resume);
  return axiosInstance.post("/resume/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getResume = (resumeId) => {
  return axiosInstance.get(`/resume/${resumeId}`);
};

export const deleteResume = (resumeId) => {
  return axiosInstance.delete(`/resume/${resumeId}`);
};

export const getAtsVisuals = (resumeId) => {
  return axiosInstance.get(`/resume/${resumeId}/ats`);
};

export const getHeatMap = (resumeId) => {
  return axiosInstance.get(`/resume/${resumeId}/heatmap`);
};

export const getAllResumes = () => {
  return axiosInstance.get("/resume");
};
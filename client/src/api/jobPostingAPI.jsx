import { axiosInstance } from "./axiosInstance.jsx";

export const allJobsWithSameResume = (resumeId) => {
  return axiosInstance.get(`/jobposting/resume/${resumeId}`);
};

export const postJob = (payload) => {
  // payload: { resumeId, sourceType, rawText? , sourceUrl? }
  return axiosInstance.post("/jobposting", payload);
};

export const getJobPosting = (jobId) => {
  return axiosInstance.get(`/jobposting/${jobId}`);
};

export const deleteJobPosting = (jobId) => {
  return axiosInstance.delete(`/jobposting/${jobId}`);
};

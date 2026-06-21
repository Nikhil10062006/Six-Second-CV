import { useState, useEffect, createContext } from "react";
import {
  postJob,
  getJobPosting,
  deleteJobPosting,
  allJobsWithSameResume,
} from "../api/jobPostingAPI.jsx";

export const JobContext = createContext();

export default function JobProvider({ children }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allJobs, setAllJobs] = useState([]);

  async function handlePostJob(payload) {
    setLoading(true);
    setError(null);
    try {
      const res = await postJob(payload);
      // FIX: postJob returns { _id, status } per ApiResponse, sitting at res.data.data
      const postedJob = res.data.data;
      setJob(postedJob);
      return postedJob; // FIX: was missing — JDInput relies on this to call onJDUploaded()
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false; // FIX: was missing
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchJob(jobId) {
    setLoading(true);
    setError(null);
    try {
      const res = await getJobPosting(jobId);
      setJob(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteJob(jobId) {
    setLoading(true);
    setError(null);
    try {
      await deleteJobPosting(jobId);
      setJob(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetAllJobs(resumeId) {
    setLoading(true);
    setError(null);
    try {
      const res = await allJobsWithSameResume(resumeId);
      setAllJobs(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <JobContext.Provider
      value={{
        job,
        error,
        loading,
        allJobs,
        handleGetAllJobs,
        handleFetchJob,
        handleDeleteJob,
        handlePostJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
}

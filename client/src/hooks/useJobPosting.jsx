import { useContext } from "react";
import { JobContext  } from "../context/jobContext.jsx";

export const useJob = () => useContext(JobContext);

import { useContext } from "react";
import { ResumeContext  } from "../context/resumeContext.jsx";

export const useResume = () => useContext(ResumeContext);

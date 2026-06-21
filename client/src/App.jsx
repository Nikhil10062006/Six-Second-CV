import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/authContext.jsx";
import ResumeProvider from "./context/resumeContext.jsx";
import JobProvider from "./context/jobContext.jsx";
import OutReachProvider from "./context/outReachContext.jsx";
import AppRoute from "./routes/appRoutes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ResumeProvider>
          <JobProvider>
            <OutReachProvider>
              <AppRoute />
            </OutReachProvider>
          </JobProvider>
        </ResumeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

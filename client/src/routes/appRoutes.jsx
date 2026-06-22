// appRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../pages/landing.jsx";
import Login from "../pages/auth/login.jsx";
import Register from "../pages/auth/register.jsx";
import UploadPage from "../pages/upload/uploadPage.jsx";
import ProtectedRoute from "./protectedRoutes.jsx";
import ResultsPage from "../pages/results/resultsPage.jsx";
import HeatmapPage from "../pages/results/heatMapPage.jsx";
import ColdReachPage from "../pages/coldreach/coldReachPage.jsx";
import DraftDetail from "../pages/drafts/draftDetail.jsx";
import DraftsPage from "../pages/drafts/draftsPage.jsx";
import ResumesPage from "../pages/resumes/resumePage.jsx";
import ResumeDetailPage from "../pages/resumes/resumeDetailPage.jsx";
export default function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:jobId"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:jobId/heatmap"
        element={
          <ProtectedRoute>
            <HeatmapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coldreach"
        element={
          <ProtectedRoute>
            <ColdReachPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drafts"
        element={
          <ProtectedRoute>
            <DraftsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drafts/:draftId"
        element={
          <ProtectedRoute>
            <DraftDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume"
        element={
          <ProtectedRoute>
            <ResumesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/:resumeId"
        element={
          <ProtectedRoute>
            <ResumeDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

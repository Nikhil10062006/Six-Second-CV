import { useAuth } from "../hooks/useAuth.jsx";
import { Navigate } from "react-router-dom";
import Spinner from "../components/spinner.jsx";


export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }
  if (user) return children;
  return <Navigate to="/login" replace />;
}

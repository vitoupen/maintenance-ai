import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../services/auth.js";

// Wrap a page element with this to require login, and optionally a specific
// role. Usage: <ProtectedRoute role="admin"><Admin /></ProtectedRoute>
export default function ProtectedRoute({ children, role }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const user = getCurrentUser();
    if (user?.role !== role) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import RequestWork from "./pages/RequestWork.jsx";
import Admin from "./pages/Admin.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { seedDemoDataIfEmpty } from "./services/workOrders.js";

export default function App() {
  useEffect(() => {
    seedDemoDataIfEmpty();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<RequestWork />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

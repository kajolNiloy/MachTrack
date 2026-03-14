import { Routes, Route } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import FactoryListPage from "./pages/FactoryListPage";
import FactoryDetailPage from "./pages/FactoryDetailPage";
import ScanPage from "./pages/ScanPage";
import TroubleshootPage from "./pages/TroubleshootPage";
import ConsumablesPage from "./pages/ConsumablesPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { user, role, loading } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'viewer', 'maintenance']}><FactoryListPage /></ProtectedRoute>} />
        <Route path="/factory/:id" element={<ProtectedRoute allowedRoles={['admin', 'viewer', 'maintenance', 'operator']}><FactoryDetailPage /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute allowedRoles={['admin', 'maintenance', 'operator']}><ScanPage /></ProtectedRoute>} />
        <Route path="/consumables" element={<ProtectedRoute allowedRoles={['admin', 'viewer', 'maintenance', 'operator']}><ConsumablesPage /></ProtectedRoute>} />
        <Route path="/troubleshoot" element={<ProtectedRoute allowedRoles={['admin', 'maintenance']}><TroubleshootPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
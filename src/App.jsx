import { Routes, Route } from "react-router-dom";
import FactoryListPage from "./pages/FactoryListPage";
import FactoryDetailPage from "./pages/FactoryDetailPage";
import ScanPage from "./pages/ScanPage";
import TroubleshootPage from "./pages/TroubleshootPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FactoryListPage />} />
      <Route path="/factory/:id" element={<FactoryDetailPage />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/troubleshoot" element={<TroubleshootPage />} />
    </Routes>
  );
}

export default App;
import { Routes, Route } from "react-router-dom";
import FactoryListPage from "./pages/FactoryListPage";
import FactoryDetailPage from "./pages/FactoryDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FactoryListPage />} />
      <Route path="/factory/:id" element={<FactoryDetailPage />} />
    </Routes>
  );
}

export default App;
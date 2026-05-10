import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import ManuscriptPage from "./pages/ManuscriptPage";
import ChapterPage from "./pages/ChapterPage";
import KBPage from "./pages/KBPage";
import WorldPage from "./pages/WorldPage";
import GraphPage from "./pages/GraphPage";
import EntityPage from "./pages/EntityPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/manuscript" replace />} />
        <Route path="/manuscript" element={<ManuscriptPage />} />
        <Route path="/manuscript/chapter/:slug" element={<ChapterPage />} />
        <Route path="/manuscript/kb" element={<KBPage />} />
        <Route path="/world" element={<WorldPage />} />
        <Route path="/world/graph" element={<GraphPage />} />
        <Route path="/world/entity/:id" element={<EntityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  );
}

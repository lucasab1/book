import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./lib/api";
import WelcomePage from "./pages/WelcomePage";
import ManuscriptPage from "./pages/ManuscriptPage";
import ChapterPage from "./pages/ChapterPage";
import KBPage from "./pages/KBPage";
import WorldPage from "./pages/WorldPage";
import GraphPage from "./pages/GraphPage";
import EntityPage from "./pages/EntityPage";
import SettingsPage from "./pages/SettingsPage";

// Guards routes that require an open project
function ProjectRoutes() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [hasProject, setHasProject] = useState(false);

  useEffect(() => {
    api.projectGetPath().then((p) => {
      setHasProject(!!p);
      setChecked(true);
      if (!p) navigate("/welcome", { replace: true });
    });
  }, [navigate]);

  if (!checked) return null;
  if (!hasProject) return null;

  return (
    <Routes>
      <Route path="/manuscript" element={<ManuscriptPage />} />
      <Route path="/manuscript/chapter/:slug" element={<ChapterPage />} />
      <Route path="/manuscript/kb" element={<KBPage />} />
      <Route path="/world" element={<WorldPage />} />
      <Route path="/world/graph" element={<GraphPage />} />
      <Route path="/world/entity/:id" element={<EntityPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/" element={<Navigate to="/manuscript" replace />} />
        <Route path="/*" element={<ProjectRoutes />} />
      </Routes>
    </HashRouter>
  );
}

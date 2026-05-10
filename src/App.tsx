import { useEffect, useState, createContext, useContext } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import { api } from "./lib/api";
import { AIProvider } from "./lib/context/AIContext";
import WorkspaceLayout from "./components/layout/WorkspaceLayout";
import WelcomePage from "./pages/WelcomePage";
import ManuscriptPage from "./pages/ManuscriptPage";
import ZenEditorPage from "./pages/ZenEditorPage";
import ProjectBriefPage from "./pages/ProjectBriefPage";
import ChapterPlanPage from "./pages/ChapterPlanPage";
import KBPage from "./pages/KBPage";
import WorldPage from "./pages/WorldPage";
import GraphPage from "./pages/GraphPage";
import EntityPage from "./pages/EntityPage";
import SettingsPage from "./pages/SettingsPage";

// Context to keep project state stable across navigation
const ProjectContext = createContext<{ path: string | null; checked: boolean }>({ path: null, checked: false });

function ProjectGuard() {
  const { path, checked } = useContext(ProjectContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (checked && !path) {
      navigate("/welcome", { replace: true });
    }
  }, [checked, path, navigate]);

  if (!checked) return null;
  if (!path) return null;

  return (
    <WorkspaceLayout>
      <Outlet />
    </WorkspaceLayout>
  );
}

export default function App() {
  const [project, setProject] = useState<{ path: string | null; checked: boolean }>({ path: null, checked: false });

  useEffect(() => {
    api.projectGetPath().then((p) => {
      setProject({ path: p, checked: true });
    });
  }, []);

  return (
    <AIProvider>
      <ProjectContext.Provider value={project}>
        <HashRouter>
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            
            <Route element={<ProjectGuard />}>
              <Route path="/" element={<Navigate to="/manuscript" replace />} />
              <Route path="/manuscript" element={<ManuscriptPage />} />
              <Route path="/manuscript/brief" element={<ProjectBriefPage />} />
              <Route path="/manuscript/plan" element={<ChapterPlanPage />} />
              <Route path="/manuscript/chapter/:slug" element={<ZenEditorPage />} />
              <Route path="/manuscript/kb" element={<KBPage />} />
              <Route path="/world" element={<WorldPage />} />
              <Route path="/world/graph" element={<GraphPage />} />
              <Route path="/world/entity/:id" element={<EntityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ProjectContext.Provider>
    </AIProvider>
  );
}

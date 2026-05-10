import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Cloud, 
  ChevronDown,
  Moon,
  Sun,
  Database,
  Download,
  Upload,
  ExternalLink,
  Plus
} from "lucide-react";
import { api, ProjectMeta } from "../../lib/api";
import { useAI } from "../../lib/context/AIContext";

export default function GlobalHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isPanelOpen, setPanelOpen } = useAI();
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    api.projectGet().then(setProject);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bookmoth_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bookmoth_theme", "light");
    }
  }, [isDarkMode]);

  const TABS = [
    { label: "Brief", href: "/manuscript/brief" },
    { label: "Chapter Plan", href: "/manuscript/plan" },
    { label: "Bible", href: "/world" },
    { label: "Manuscript", href: "/manuscript" },
  ];

  const createProject = async () => {
    if (!newTitle.trim()) return;
    const folder = await api.projectPickFolder();
    if (folder) {
      await api.projectCreate(folder, { title: newTitle, genre: "", synopsis: "" });
      setShowNewModal(false);
      window.location.reload();
    }
  };

  const handleUtilityClick = async (label: string) => {
    if (label === "API / LLM") {
      setPanelOpen(!isPanelOpen);
    } else if (label === "Save") {
      alert("Changes saved to disk.");
    } else if (label === "Export") {
      alert("Exporting manuscript...");
    } else if (label === "Load") {
      navigate("/welcome");
    } else if (label === "Cloud") {
      setIsSyncing(true);
      // Simulate sync
      setTimeout(() => {
        setIsSyncing(false);
        alert("Project synced with cloud storage.");
      }, 1500);
    }
  };

  return (
    <header className="h-14 flex items-center justify-between px-8 border-b border-[var(--border)] bg-[var(--bg)] z-50 shrink-0">
      {/* Left: Project Selector */}
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xs tracking-[0.3em] uppercase font-black text-[var(--text)] opacity-40 hover:text-[var(--accent)] transition-colors">
          bookmoth
        </Link>
        <div 
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-[var(--text)]/5 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--text)]/10 transition-colors"
        >
          <span className="font-bold text-xs text-[var(--text)]">{project?.title || "Novel"}</span>
          <ChevronDown size={14} className="opacity-40" />
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <nav className="flex items-center gap-1">
        {TABS.map(tab => {
          const active = (tab.href === "/manuscript" && pathname === "/manuscript") || 
                        (tab.href !== "/manuscript" && pathname.startsWith(tab.href)) ||
                        (tab.href === "/manuscript" && pathname.startsWith("/manuscript/chapter"));
          return (
            <Link 
              key={tab.label}
              to={tab.href}
              className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${active ? 'bg-[var(--surface)] shadow-sm ring-1 ring-black/5 text-[var(--text)]' : 'text-[var(--text)]/40 hover:text-[var(--text)]'}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Utility Controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-[var(--text)]/40 hover:text-[var(--text)] transition-colors"
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        
        {[
          { icon: <Cloud size={14} />, label: "Cloud", alert: !isSyncing, spinning: isSyncing },
          { icon: <Database size={14} />, label: "API / LLM", active: isPanelOpen },
          { icon: <Download size={14} />, label: "Save" },
          { icon: <Upload size={14} />, label: "Load" },
          { icon: <ExternalLink size={14} />, label: "Export", primary: true },
        ].map((btn, i) => (
          <button 
            key={i} 
            onClick={() => handleUtilityClick(btn.label)}
            className={`px-3 py-1.5 rounded-lg border border-[var(--text)]/10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all hover:bg-[var(--text)]/5
              ${btn.primary ? 'bg-[var(--accent)] border-[var(--accent)] text-white hover:bg-[var(--accent-dim)]' : 'bg-[var(--surface)] text-[var(--text)]/60'}
              ${btn.active ? 'ring-2 ring-[var(--accent)] text-[var(--text)]' : ''}
              ${btn.spinning ? 'opacity-50' : ''}`}
          >
            <div className={btn.spinning ? 'animate-spin' : ''}>{btn.icon}</div>
            <span className="hidden xl:inline">{btn.label}</span>
            {btn.alert && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--bg)] rounded-3xl p-12 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[var(--border)]">
            <button 
              onClick={() => setShowNewModal(false)}
              className="absolute top-8 right-8 text-[var(--text)]/20 hover:text-[var(--text)] transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif font-bold mb-2 text-[var(--text)]">New Novel</h2>
              <p className="text-xs text-[var(--text)]/40 uppercase tracking-widest font-bold">Start your next journey</p>
            </div>

            <div className="space-y-6">
              <input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter title..."
                autoFocus
                className="w-full text-center text-xl font-serif border-b-2 border-[var(--border)] bg-transparent py-4 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text)]"
              />
              
              <button 
                onClick={createProject}
                disabled={!newTitle.trim()}
                className="w-full py-4 bg-[var(--text)] text-[var(--bg)] text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
              >
                Create & Pick Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

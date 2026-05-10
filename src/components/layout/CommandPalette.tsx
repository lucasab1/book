import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Book, Globe, Settings, PenTool, Hash, Moon, Sun, ArrowRight } from "lucide-react";
import { api, ProjectMeta } from "../../lib/api";
import { useAI } from "../../lib/context/AIContext";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setPanelOpen } = useAI();
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const COMMANDS = [
    { id: "nav-manuscript", icon: <PenTool size={16} />, label: "Write Manuscript", section: "Navigation", action: () => navigate("/manuscript") },
    { id: "nav-world", icon: <Globe size={16} />, label: "Open Story Bible", section: "Navigation", action: () => navigate("/world") },
    { id: "nav-graph", icon: <Hash size={16} />, label: "View Relationship Graph", section: "Navigation", action: () => navigate("/world/graph") },
    { id: "nav-settings", icon: <Settings size={16} />, label: "Project Settings", section: "Navigation", action: () => navigate("/settings") },
    { id: "ai-summon", icon: <Book size={16} />, label: "Summon AI Assistant", section: "AI & Actions", action: () => setPanelOpen(true) },
    { id: "theme-toggle", icon: isDarkMode ? <Sun size={16} /> : <Moon size={16} />, label: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`, section: "Preferences", action: () => setIsDarkMode(!isDarkMode) },
  ];

  const filteredCommands = search 
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(search.toLowerCase()) || c.section.toLowerCase().includes(search.toLowerCase()))
    : COMMANDS;

  const sections = Array.from(new Set(filteredCommands.map(c => c.section)));

  return (
    <>
      {/* Floating Trigger Button (Minimalist Navigation) */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-40"
      >
        <button 
          onClick={() => setIsOpen(true)}
          className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 text-[11px] font-bold text-[var(--text)]/60 hover:text-[var(--text)] transition-colors group shadow-elegant"
        >
          <Search size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="hidden md:inline">{project?.title || "Bookmoth"}</span>
          <span className="opacity-40 font-mono tracking-widest hidden md:inline ml-2">⌘K</span>
        </button>
      </motion.div>

      {/* Command Palette Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
            />
            <div className="fixed inset-0 flex items-start justify-center pt-[15vh] z-[101] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full max-w-2xl glass-panel shadow-2xl rounded-2xl overflow-hidden pointer-events-auto bg-[var(--surface)]/90 flex flex-col"
              >
                <div className="flex items-center px-4 py-4 border-b border-[var(--border)]">
                  <Search size={18} className="text-[var(--accent)] mr-3" />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-[var(--text)] placeholder:opacity-30"
                  />
                  <div className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-30 px-2 py-1 bg-[var(--text)]/5 rounded">ESC</div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-hide">
                  {sections.map(section => (
                    <div key={section} className="mb-4">
                      <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-[var(--text)]/30">
                        {section}
                      </div>
                      {filteredCommands.filter(c => c.section === section).map(cmd => (
                        <button
                          key={cmd.id}
                          onClick={() => { cmd.action(); setIsOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[var(--text)]/5 text-[var(--text)] group transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-[var(--text)]/40 group-hover:text-[var(--accent)] transition-colors">
                              {cmd.icon}
                            </div>
                            <span className="text-[13px] font-medium">{cmd.label}</span>
                          </div>
                          <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all" />
                        </button>
                      ))}
                    </div>
                  ))}
                  
                  {filteredCommands.length === 0 && (
                    <div className="py-12 text-center text-[var(--text)]/40 text-sm">
                      No commands found for "{search}"
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
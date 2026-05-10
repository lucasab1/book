import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useAI } from "../lib/context/AIContext";

const LINKS = [
  { href: "/manuscript", label: "Manuscript" },
  { href: "/world", label: "World" },
  { href: "/world/graph", label: "Graph" },
  { href: "/settings", label: "Settings" },
];

export default function AppNav() {
  const { pathname } = useLocation();
  const [projectTitle, setProjectTitle] = useState<string>("");
  const { isPanelOpen, setPanelOpen, currentProvider } = useAI();

  useEffect(() => {
    api.projectGet().then((p) => { if (p?.title) setProjectTitle(p.title); });
  }, []);

  return (
    <nav
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      className="flex items-center justify-between px-8 py-2"
    >
      <div className="flex items-center gap-12">
        <Link to="/" className="text-xs tracking-[0.3em] uppercase font-black text-text/40 hover:text-accent transition-colors">
          Bookmoth
        </Link>
        
        <div className="flex items-center">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                to={l.href}
                style={{
                  color: active ? "var(--text)" : "var(--muted)",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                }}
                className="text-[11px] px-4 py-3 uppercase tracking-widest font-bold hover:text-text transition-all"
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {projectTitle && (
          <span style={{ color: "var(--muted)" }} className="text-[10px] uppercase tracking-[0.2em] font-black hidden lg:block">
            {projectTitle}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => api.projectOpenTerminal()}
            className="p-2 text-muted hover:text-text transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          </button>

          <button
            onClick={() => setPanelOpen(!isPanelOpen)}
            style={{
              color: isPanelOpen ? "var(--accent)" : "var(--muted)",
            }}
            className="flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest hover:text-text transition-all"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPanelOpen ? 'bg-accent animate-pulse' : 'bg-muted'}`}></span>
            Assistant
          </button>
        </div>
      </div>
    </nav>
  );
}

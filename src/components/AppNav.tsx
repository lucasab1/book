import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";

const LINKS = [
  { href: "/manuscript", label: "Manuscript" },
  { href: "/world", label: "World" },
  { href: "/world/graph", label: "Graph" },
  { href: "/settings", label: "Settings" },
];

export default function AppNav({ onToggleClaude, claudeOpen }: { onToggleClaude?: () => void; claudeOpen?: boolean }) {
  const { pathname } = useLocation();
  const [projectTitle, setProjectTitle] = useState<string>("");

  useEffect(() => {
    api.projectGet().then((p) => { if (p?.title) setProjectTitle(p.title); });
  }, []);

  return (
    <nav
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      className="flex items-center justify-between px-4 py-2.5"
    >
      <div className="flex items-center gap-4">
        <Link to="/" style={{ color: "var(--accent)" }} className="text-sm tracking-widest uppercase font-bold shrink-0">
          Bookmoth
        </Link>
        {projectTitle && (
          <span style={{ color: "var(--muted)", borderLeft: "1px solid var(--border)" }} className="text-xs pl-4 truncate max-w-[160px]">
            {projectTitle}
          </span>
        )}
        <div className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                to={l.href}
                style={{
                  color: active ? "var(--text)" : "var(--muted)",
                  background: active ? "var(--surface2)" : "transparent",
                }}
                className="text-xs px-3 py-1.5 rounded hover:opacity-80 transition-all"
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => api.projectOpenTerminal()}
          title="Open terminal in project folder"
          style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
          className="text-xs px-2.5 py-1.5 rounded hover:opacity-80 font-mono"
        >
          &gt;_
        </button>
        {onToggleClaude && (
          <button
            onClick={onToggleClaude}
            title="Toggle Claude panel"
            style={{
              border: "1px solid var(--border)",
              background: claudeOpen ? "var(--accent)" : "transparent",
              color: claudeOpen ? "#000" : "var(--muted)",
            }}
            className="text-xs px-3 py-1.5 rounded hover:opacity-80 font-bold"
          >
            Claude
          </button>
        )}
      </div>
    </nav>
  );
}

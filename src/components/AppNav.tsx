import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { href: "/manuscript", label: "Manuscript" },
  { href: "/world", label: "World" },
  { href: "/world/graph", label: "Graph" },
  { href: "/settings", label: "Settings" },
];

export default function AppNav() {
  const { pathname } = useLocation();
  return (
    <nav
      style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      className="flex items-center justify-between px-6 py-3"
    >
      <div className="flex items-center gap-6">
        <Link to="/" style={{ color: "var(--accent)" }} className="text-base tracking-widest uppercase font-bold shrink-0">
          Bookmoth
        </Link>
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
                className="text-sm px-3 py-1.5 rounded hover:opacity-80 transition-all"
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

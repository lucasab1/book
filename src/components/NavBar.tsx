"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar({ title }: { title?: string }) {
  const path = usePathname();
  const isManuscript = path.startsWith("/manuscript");

  return (
    <nav style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-4 shrink-0">
      <div className="flex items-center gap-4">
        <Link href="/" style={{ color: "var(--accent)" }} className="text-lg tracking-widest uppercase font-bold">
          Bookmoth
        </Link>
        {title && (
          <>
            <span style={{ color: "var(--border)" }}>/</span>
            <span style={{ color: "var(--muted)" }} className="text-sm truncate max-w-60">{title}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isManuscript && (
          <Link
            href="/manuscript"
            style={{ background: "var(--accent)", color: "#000" }}
            className="text-xs px-4 py-2 rounded font-bold hover:opacity-90 transition-opacity"
          >
            Manuscript
          </Link>
        )}
        {isManuscript && (
          <div style={{ color: "var(--muted)" }} className="text-xs flex items-center gap-3">
            <Link href="/manuscript" className="hover:opacity-80">Chapters</Link>
            <Link href="/manuscript/kb" className="hover:opacity-80">Knowledge base</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

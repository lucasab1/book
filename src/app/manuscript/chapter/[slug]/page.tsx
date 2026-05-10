"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ClaudeCodePanel from "@/components/ClaudeCodePanel";

export default function ChapterPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [saved, setSaved] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/chapters/${slug}`)
      .then((r) => {
        if (!r.ok) { router.push("/manuscript"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setTitle(data.meta.title || slug);
        setBrief(data.meta.brief || "");
        setContent(data.content || "");
        setLoaded(true);
      });
  }, [slug, router]);

  function scheduleSave(newContent: string, newTitle: string, newBrief: string) {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/chapters/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, title: newTitle, brief: newBrief }),
      });
      setSaved(true);
    }, 1000);
  }

  function handleContent(val: string) {
    setContent(val);
    scheduleSave(val, title, brief);
  }

  function handleTitle(val: string) {
    setTitle(val);
    scheduleSave(content, val, brief);
  }

  function handleBrief(val: string) {
    setBrief(val);
    scheduleSave(content, title, val);
  }

  if (!loaded) return (
    <div style={{ background: "var(--bg)", color: "var(--muted)", minHeight: "100vh" }} className="flex items-center justify-center text-sm">
      Loading…
    </div>
  );

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" style={{ color: "var(--accent)" }} className="text-base tracking-widest uppercase font-bold">
            Bookmoth
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <Link href="/manuscript" style={{ color: "var(--muted)" }} className="text-sm hover:opacity-80">
            Manuscript
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span className="text-sm truncate max-w-48">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ color: saved ? "var(--muted)" : "var(--accent)" }} className="text-xs">
            {saved ? `${wordCount.toLocaleString()} words · saved` : "Saving…"}
          </span>
          <div className="relative">
            <ClaudeCodePanel />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", width: "240px", minWidth: "240px" }}
          className="flex flex-col p-5 overflow-y-auto"
        >
          <div className="mb-5">
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--accent)" }}>
              Chapter title
            </label>
            <input
              value={title}
              onChange={(e) => handleTitle(e.target.value)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--accent)" }}>
              Brief
            </label>
            <textarea
              value={brief}
              onChange={(e) => handleBrief(e.target.value)}
              rows={7}
              placeholder="What happens in this chapter? Claude Code uses this as the chapter brief."
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "none" }}
              className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }} className="pt-5 mt-auto">
            <p style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest mb-3">
              Claude Code
            </p>
            <div className="flex flex-col gap-2">
              {[
                { cmd: "/write", note: "draft this chapter" },
                { cmd: "/critique", note: "get feedback" },
                { cmd: "/continuity", note: "check errors" },
              ].map((c) => (
                <div key={c.cmd} className="flex items-center gap-2">
                  <code style={{ color: "var(--accent)" }} className="text-xs w-24 shrink-0">{c.cmd}</code>
                  <span style={{ color: "var(--muted)" }} className="text-xs">{c.note}</span>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--muted)" }} className="text-xs mt-4 leading-relaxed">
              File: <code style={{ color: "var(--text)" }}>story/{slug}.md</code>
            </p>
          </div>
        </aside>

        {/* Editor */}
        <textarea
          value={content}
          onChange={(e) => handleContent(e.target.value)}
          placeholder={`Start writing "${title}"…\n\nOr run /write in Claude Code to generate a draft from the brief.`}
          style={{
            background: "var(--bg)",
            color: "var(--text)",
            border: "none",
            resize: "none",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "1.05rem",
            lineHeight: "1.9",
            flex: 1,
          }}
          className="w-full px-16 py-12 outline-none"
          spellCheck
        />
      </div>
    </div>
  );
}

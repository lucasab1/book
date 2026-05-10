"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChapterFile, ProjectMeta } from "@/lib/types";
import ClaudeCodePanel from "@/components/ClaudeCodePanel";
import AppNav from "@/components/AppNav";

export default function ManuscriptPage() {
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [chapters, setChapters] = useState<ChapterFile[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: "", genre: "", synopsis: "" });

  useEffect(() => {
    fetch("/api/project").then((r) => r.json()).then((p: ProjectMeta) => {
      setProject(p);
      setMetaForm({ title: p.title, genre: p.genre, synopsis: p.synopsis });
    });
    fetchChapters();
  }, []);

  async function fetchChapters() {
    const res = await fetch("/api/chapters");
    setChapters(await res.json());
  }

  async function saveMeta() {
    const res = await fetch("/api/project", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metaForm),
    });
    setProject(await res.json());
    setEditingMeta(false);
  }

  async function addChapter() {
    if (!newTitle.trim()) return;
    await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), brief: newBrief.trim() }),
    });
    setNewTitle("");
    setNewBrief("");
    setShowNew(false);
    fetchChapters();
  }

  async function deleteChapter(slug: string) {
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    await fetch(`/api/chapters/${slug}`, { method: "DELETE" });
    fetchChapters();
  }

  const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <AppNav />
      {/* Sub-nav */}
      <nav style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-3">
        <div style={{ color: "var(--muted)" }} className="text-xs flex items-center gap-3">
          <span className="font-bold" style={{ color: "var(--text)" }}>Chapters</span>
          <span>·</span>
          <Link href="/manuscript/kb" className="hover:opacity-80">Knowledge base</Link>
        </div>
        <div className="relative">
          <ClaudeCodePanel />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Project header */}
        {editingMeta ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-6 mb-10">
            <div className="flex flex-col gap-4">
              <input
                value={metaForm.title}
                onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
                placeholder="Title"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                className="px-4 py-2 rounded text-2xl font-bold outline-none focus:border-amber-600"
              />
              <input
                value={metaForm.genre}
                onChange={(e) => setMetaForm({ ...metaForm, genre: e.target.value })}
                placeholder="Genre"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                className="px-4 py-2 rounded text-sm outline-none focus:border-amber-600"
              />
              <textarea
                value={metaForm.synopsis}
                onChange={(e) => setMetaForm({ ...metaForm, synopsis: e.target.value })}
                rows={4}
                placeholder="Synopsis"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }}
                className="px-4 py-2 rounded text-sm outline-none focus:border-amber-600 leading-relaxed"
              />
              <div className="flex gap-3">
                <button onClick={saveMeta} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-5 py-2 rounded font-bold">
                  Save
                </button>
                <button onClick={() => setEditingMeta(false)} style={{ color: "var(--muted)" }} className="text-xs px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-10" onClick={() => setEditingMeta(true)} title="Click to edit" style={{ cursor: "pointer" }}>
            <h1 className="text-4xl font-bold mb-1 hover:opacity-80 transition-opacity">
              {project?.title || "My Novel"}
            </h1>
            {project?.genre && <p style={{ color: "var(--accent)" }} className="text-sm italic mb-2">{project.genre}</p>}
            {project?.synopsis ? (
              <p style={{ color: "var(--muted)" }} className="text-sm leading-relaxed max-w-2xl">{project.synopsis}</p>
            ) : (
              <p style={{ color: "var(--muted)" }} className="text-sm italic">No synopsis yet — click to add one.</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ borderBottom: "1px solid var(--border)" }} className="flex gap-8 pb-6 mb-10">
          {[
            { label: "Chapters", value: chapters.length },
            { label: "Words", value: totalWords.toLocaleString() },
            { label: "With draft", value: chapters.filter((c) => c.wordCount > 0).length },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p style={{ color: "var(--muted)" }} className="text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Chapter list */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg">Chapters</h2>
          <button
            onClick={() => setShowNew(true)}
            style={{ background: "var(--accent)", color: "#000" }}
            className="text-xs px-4 py-2 rounded font-bold hover:opacity-90"
          >
            + Add chapter
          </button>
        </div>

        {chapters.length === 0 ? (
          <div style={{ border: "1px dashed var(--border)" }} className="rounded-lg py-20 text-center mb-6">
            <p style={{ color: "var(--muted)" }} className="mb-4">No chapters yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {chapters.map((ch, i) => (
              <div
                key={ch.slug}
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                className="rounded-lg p-5 flex items-start justify-between group"
              >
                <Link href={`/manuscript/chapter/${ch.slug}`} className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span style={{ color: "var(--muted)" }} className="text-xs font-mono shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-bold group-hover:opacity-80 transition-opacity">{ch.title}</h3>
                  </div>
                  {ch.brief && (
                    <p style={{ color: "var(--muted)" }} className="text-xs mt-1 ml-8 truncate">{ch.brief}</p>
                  )}
                  <div style={{ color: "var(--muted)" }} className="flex gap-4 text-xs mt-2 ml-8">
                    {ch.wordCount > 0 ? (
                      <span>{ch.wordCount.toLocaleString()} words</span>
                    ) : (
                      <span className="italic">No draft yet</span>
                    )}
                    {ch.hasVoiceDraft && (
                      <span style={{ color: "var(--accent)" }}>AI draft in work/</span>
                    )}
                    <span>Updated {new Date(ch.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
                <button
                  onClick={() => deleteChapter(ch.slug)}
                  style={{ color: "var(--muted)" }}
                  className="ml-4 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New chapter form */}
        {showNew && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-6">
            <h3 className="font-bold mb-4">New chapter</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Chapter title"
              autoFocus
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              className="w-full px-4 py-2 rounded text-sm outline-none focus:border-amber-600 mb-3"
              onKeyDown={(e) => e.key === "Enter" && addChapter()}
            />
            <textarea
              value={newBrief}
              onChange={(e) => setNewBrief(e.target.value)}
              rows={3}
              placeholder="Brief: what happens in this chapter? (Claude Code uses this to draft)"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }}
              className="w-full px-4 py-2 rounded text-sm outline-none focus:border-amber-600 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={addChapter} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-5 py-2 rounded font-bold hover:opacity-90">
                Add chapter
              </button>
              <button onClick={() => { setShowNew(false); setNewTitle(""); setNewBrief(""); }} style={{ color: "var(--muted)" }} className="text-xs px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Claude Code tip */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-5 mt-10 flex gap-4 items-start">
          <code style={{ color: "var(--accent)" }} className="text-sm shrink-0 mt-0.5">$</code>
          <div>
            <p className="text-sm font-bold mb-1">Use Claude Code to draft chapters</p>
            <p style={{ color: "var(--muted)" }} className="text-xs leading-relaxed">
              Open a terminal in this directory and run{" "}
              <code style={{ color: "var(--text)" }}>claude</code>. Then use{" "}
              <code style={{ color: "var(--accent)" }}>/write</code> to draft,{" "}
              <code style={{ color: "var(--accent)" }}>/critique</code> for feedback, or{" "}
              <code style={{ color: "var(--accent)" }}>/brainstorm</code> to explore ideas.
              Claude reads your chapter files and writes drafts to <code style={{ color: "var(--text)" }}>work/drafts/</code>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

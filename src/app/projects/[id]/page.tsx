"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, saveProject, saveChapter, deleteChapter, generateId } from "@/lib/storage";
import { Project, Chapter } from "@/lib/types";
import VoiceAnalyzer from "@/components/VoiceAnalyzer";
import VoiceProfileCard from "@/components/VoiceProfileCard";

type Tab = "chapters" | "voice" | "settings";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("chapters");
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisVal, setSynopsisVal] = useState("");

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push("/projects"); return; }
    setProject(p);
    setSynopsisVal(p.synopsis);
  }, [id, router]);

  function reload() {
    const p = getProject(id);
    if (p) setProject(p);
  }

  function handleVoiceComplete(profile: import("@/lib/types").VoiceProfile, sample: string) {
    if (!project) return;
    const updated = { ...project, voiceProfile: profile, sampleText: sample };
    saveProject(updated);
    setProject(updated);
    setTab("chapters");
  }

  function handleAddChapter() {
    if (!newTitle.trim() || !project) return;
    const now = new Date().toISOString();
    const chapter: Chapter = {
      id: generateId(),
      title: newTitle.trim(),
      brief: newBrief.trim(),
      content: "",
      order: project.chapters.length,
      createdAt: now,
      updatedAt: now,
    };
    saveChapter(id, chapter);
    setNewTitle("");
    setNewBrief("");
    setShowNewChapter(false);
    reload();
  }

  function handleDeleteChapter(chId: string) {
    if (!confirm("Delete this chapter?")) return;
    deleteChapter(id, chId);
    reload();
  }

  function saveSynopsis() {
    if (!project) return;
    const updated = { ...project, synopsis: synopsisVal };
    saveProject(updated);
    setProject(updated);
    setEditingSynopsis(false);
  }

  if (!project) return null;

  const sortedChapters = [...project.chapters].sort((a, b) => a.order - b.order);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-between px-8 py-5"
      >
        <Link href="/" style={{ color: "var(--accent)" }} className="text-xl tracking-widest uppercase font-bold">
          Bookmoth
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/projects" style={{ color: "var(--muted)" }} className="text-sm hover:opacity-80">
            ← Projects
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-1">{project.title}</h1>
              {project.genre && (
                <p style={{ color: "var(--accent)" }} className="text-sm italic mb-3">{project.genre}</p>
              )}
            </div>
            {!project.voiceProfile && (
              <button
                onClick={() => setTab("voice")}
                style={{ background: "var(--accent)", color: "#000" }}
                className="text-xs px-4 py-2 rounded font-bold hover:opacity-90 whitespace-nowrap shrink-0"
              >
                Analyze voice
              </button>
            )}
          </div>

          {/* Synopsis */}
          {editingSynopsis ? (
            <div className="mt-4">
              <textarea
                value={synopsisVal}
                onChange={(e) => setSynopsisVal(e.target.value)}
                rows={4}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  resize: "vertical",
                }}
                className="w-full px-4 py-3 rounded text-sm outline-none focus:border-amber-600 leading-relaxed mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={saveSynopsis}
                  style={{ background: "var(--accent)", color: "#000" }}
                  className="text-xs px-4 py-2 rounded font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingSynopsis(false); setSynopsisVal(project.synopsis); }}
                  style={{ color: "var(--muted)" }}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              style={{ color: "var(--muted)" }}
              className="text-sm leading-relaxed mt-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setEditingSynopsis(true)}
              title="Click to edit"
            >
              {project.synopsis || <span className="italic">No synopsis yet — click to add one.</span>}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border)" }} className="flex gap-1 mb-10">
          {(["chapters", "voice", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--text)" : "var(--muted)",
              }}
              className="px-4 py-3 text-sm font-bold capitalize transition-colors hover:opacity-80"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Chapters tab */}
        {tab === "chapters" && (
          <div>
            {sortedChapters.length === 0 ? (
              <div
                style={{ border: "1px dashed var(--border)" }}
                className="rounded-lg py-20 text-center mb-6"
              >
                <p style={{ color: "var(--muted)" }} className="mb-4">
                  No chapters yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 mb-6">
                {sortedChapters.map((ch, i) => (
                  <div
                    key={ch.id}
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    className="rounded-lg p-5 flex items-start justify-between group"
                  >
                    <Link href={`/projects/${id}/chapter/${ch.id}`} className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span style={{ color: "var(--muted)" }} className="text-xs font-mono shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-bold group-hover:opacity-80 transition-opacity">
                          {ch.title}
                        </h3>
                      </div>
                      {ch.brief && (
                        <p style={{ color: "var(--muted)" }} className="text-xs mt-1 ml-8 truncate">
                          {ch.brief}
                        </p>
                      )}
                      <div style={{ color: "var(--muted)" }} className="flex gap-4 text-xs mt-2 ml-8">
                        {ch.content
                          ? <span>{ch.content.trim().split(/\s+/).length} words</span>
                          : <span className="italic">No draft yet</span>}
                        <span>Updated {new Date(ch.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleDeleteChapter(ch.id)}
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
            {showNewChapter ? (
              <div
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                className="rounded-lg p-6"
              >
                <h3 className="font-bold mb-4">New chapter</h3>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Chapter title"
                  autoFocus
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                  className="w-full px-4 py-2 rounded text-sm outline-none focus:border-amber-600 mb-3"
                />
                <textarea
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  rows={3}
                  placeholder="Brief: what happens in this chapter? (optional, you can fill this in later)"
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    resize: "vertical",
                  }}
                  className="w-full px-4 py-2 rounded text-sm outline-none focus:border-amber-600 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddChapter}
                    style={{ background: "var(--accent)", color: "#000" }}
                    className="text-xs px-5 py-2 rounded font-bold hover:opacity-90"
                  >
                    Add chapter
                  </button>
                  <button
                    onClick={() => { setShowNewChapter(false); setNewTitle(""); setNewBrief(""); }}
                    style={{ color: "var(--muted)" }}
                    className="text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewChapter(true)}
                style={{ border: "1px dashed var(--border)", color: "var(--muted)" }}
                className="w-full py-3 rounded text-sm hover:border-amber-700 hover:opacity-80 transition-all"
              >
                + Add chapter
              </button>
            )}
          </div>
        )}

        {/* Voice tab */}
        {tab === "voice" && (
          <div>
            {project.voiceProfile ? (
              <VoiceProfileCard
                profile={project.voiceProfile}
                onReanalyze={() => {
                  const updated = { ...project, voiceProfile: null };
                  saveProject(updated);
                  setProject(updated);
                }}
              />
            ) : (
              <VoiceAnalyzer
                initialSample={project.sampleText}
                onComplete={handleVoiceComplete}
              />
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === "settings" && (
          <div className="max-w-md">
            <h2 className="text-xl font-bold mb-6">Project settings</h2>
            <p style={{ color: "var(--muted)" }} className="text-sm mb-4">
              Edit the title, genre, and synopsis by clicking them on the main project view.
            </p>
            <div
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
              className="rounded p-4 text-sm"
            >
              <p className="font-bold mb-1">Storage</p>
              <p style={{ color: "var(--muted)" }} className="text-xs leading-relaxed">
                All data is stored in your browser&apos;s localStorage. Nothing is sent to any server except your Anthropic API key in API requests.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, saveChapter, getApiKey } from "@/lib/storage";
import { Project, Chapter } from "@/lib/types";

type Panel = "editor" | "draft" | "notes";

export default function ChapterPage() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [panel, setPanel] = useState<Panel>("editor");
  const [content, setContent] = useState("");
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("");
  const [draftStream, setDraftStream] = useState("");
  const [notesStream, setNotesStream] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [gettingNotes, setGettingNotes] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push("/projects"); return; }
    const ch = p.chapters.find((c) => c.id === chapterId);
    if (!ch) { router.push(`/projects/${id}`); return; }
    setProject(p);
    setChapter(ch);
    setContent(ch.content);
    setBrief(ch.brief);
    setTitle(ch.title);
  }, [id, chapterId, router]);

  function handleContentChange(val: string) {
    setContent(val);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!chapter) return;
      const updated = { ...chapter, content: val, brief };
      saveChapter(id, updated);
      setChapter(updated);
      setSaved(true);
    }, 1200);
  }

  function handleBriefChange(val: string) {
    setBrief(val);
    if (!chapter) return;
    const updated = { ...chapter, brief: val };
    saveChapter(id, updated);
    setChapter(updated);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!chapter) return;
    const updated = { ...chapter, title: val };
    saveChapter(id, updated);
    setChapter(updated);
  }

  function acceptDraft() {
    setContent(draftStream);
    setSaved(false);
    if (chapter) {
      const updated = { ...chapter, content: draftStream };
      saveChapter(id, updated);
      setChapter(updated);
      setSaved(true);
    }
    setPanel("editor");
  }

  async function draftChapter() {
    const apiKey = getApiKey();
    if (!apiKey) { alert("Set your Anthropic API key first."); return; }
    if (!project?.voiceProfile) { alert("Analyze your voice profile first in the project settings."); return; }
    if (!brief.trim()) { alert("Add a chapter brief first."); return; }
    setDrafting(true);
    setDraftStream("");
    setPanel("draft");

    const previousChapters = project.chapters
      .filter((c) => c.order < (chapter?.order ?? 0) && c.content)
      .sort((a, b) => a.order - b.order)
      .map((c) => `## ${c.title}\n\n${c.content.slice(0, 800)}…`)
      .join("\n\n");

    try {
      const res = await fetch("/api/draft-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterBrief: brief,
          voiceProfile: project.voiceProfile,
          synopsis: project.synopsis,
          previousChapters,
          apiKey,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setDraftStream(text);
      }
    } catch (err) {
      console.error(err);
      alert("Draft failed. Check your API key.");
    } finally {
      setDrafting(false);
    }
  }

  async function getEditorNotes() {
    const apiKey = getApiKey();
    if (!apiKey) { alert("Set your Anthropic API key first."); return; }
    if (!content.trim()) { alert("Write something first."); return; }
    setGettingNotes(true);
    setNotesStream("");
    setPanel("notes");
    try {
      const res = await fetch("/api/editor-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterContent: content,
          voiceProfile: project?.voiceProfile ?? null,
          synopsis: project?.synopsis ?? "",
          chapterBrief: brief,
          apiKey,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setNotesStream(text);
      }
    } catch (err) {
      console.error(err);
      alert("Editor notes failed. Check your API key.");
    } finally {
      setGettingNotes(false);
    }
  }

  if (!project || !chapter) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-between px-6 py-4 shrink-0"
      >
        <div className="flex items-center gap-4">
          <Link href="/" style={{ color: "var(--accent)" }} className="text-lg tracking-widest uppercase font-bold">
            Bookmoth
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <Link href={`/projects/${id}`} style={{ color: "var(--muted)" }} className="text-sm hover:opacity-80 truncate max-w-40">
            {project.title}
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ color: "var(--text)" }} className="text-sm truncate max-w-48">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: saved ? "var(--muted)" : "var(--accent)" }} className="text-xs">
            {saved ? `${wordCount} words` : "Saving…"}
          </span>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside
          style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", width: "260px", minWidth: "260px" }}
          className="flex flex-col p-5 overflow-y-auto"
        >
          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--accent)" }}>
              Chapter title
            </label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600"
            />
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--accent)" }}>
              Brief
            </label>
            <textarea
              value={brief}
              onChange={(e) => handleBriefChange(e.target.value)}
              rows={6}
              placeholder="What happens in this chapter?"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                resize: "none",
              }}
              className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={draftChapter}
              disabled={drafting}
              style={{ background: "var(--accent)", color: "#000" }}
              className="w-full py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {drafting ? "Drafting…" : "Draft chapter"}
            </button>
            <button
              onClick={getEditorNotes}
              disabled={gettingNotes}
              style={{ border: "1px solid var(--border)", color: "var(--text)" }}
              className="w-full py-2 rounded font-bold text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {gettingNotes ? "Reading…" : "Editor notes"}
            </button>
          </div>

          {!project.voiceProfile && (
            <p style={{ color: "var(--accent)" }} className="text-xs mt-4 text-center">
              <Link href={`/projects/${id}#voice`} className="underline">
                Analyze your voice
              </Link>{" "}
              for better drafts.
            </p>
          )}
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Panel tabs */}
          <div
            style={{ borderBottom: "1px solid var(--border)" }}
            className="flex gap-1 px-6 pt-1 shrink-0"
          >
            {(["editor", "draft", "notes"] as Panel[]).map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                style={{
                  borderBottom: panel === p ? "2px solid var(--accent)" : "2px solid transparent",
                  color: panel === p ? "var(--text)" : "var(--muted)",
                }}
                className="px-4 py-3 text-sm font-bold capitalize transition-colors hover:opacity-80"
              >
                {p === "draft" ? "AI Draft" : p === "notes" ? "Editor Notes" : "Editor"}
              </button>
            ))}
          </div>

          {/* Editor */}
          {panel === "editor" && (
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={`Start writing "${title}"…`}
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
          )}

          {/* Draft panel */}
          {panel === "draft" && (
            <div className="flex-1 overflow-y-auto px-16 py-12">
              {drafting && !draftStream && (
                <p style={{ color: "var(--muted)" }} className="italic animate-pulse">
                  Drafting in your voice…
                </p>
              )}
              {draftStream ? (
                <>
                  <div
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "1.05rem",
                      lineHeight: "1.9",
                      whiteSpace: "pre-wrap",
                      color: "var(--text)",
                    }}
                  >
                    {draftStream}
                  </div>
                  {!drafting && (
                    <div className="flex gap-4 mt-10">
                      <button
                        onClick={acceptDraft}
                        style={{ background: "var(--accent)", color: "#000" }}
                        className="px-6 py-2 rounded font-bold text-sm hover:opacity-90"
                      >
                        Accept draft
                      </button>
                      <button
                        onClick={draftChapter}
                        style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                        className="px-6 py-2 rounded font-bold text-sm hover:opacity-80"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </>
              ) : !drafting ? (
                <div className="text-center py-20">
                  <p style={{ color: "var(--muted)" }} className="mb-6">
                    No draft yet. Add a brief and click &ldquo;Draft chapter&rdquo;.
                  </p>
                  <button
                    onClick={draftChapter}
                    style={{ background: "var(--accent)", color: "#000" }}
                    className="px-6 py-2 rounded font-bold text-sm hover:opacity-90"
                  >
                    Draft chapter
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Notes panel */}
          {panel === "notes" && (
            <div className="flex-1 overflow-y-auto px-12 py-10">
              {gettingNotes && !notesStream && (
                <p style={{ color: "var(--muted)" }} className="italic animate-pulse">
                  Reading your chapter…
                </p>
              )}
              {notesStream ? (
                <div
                  style={{ color: "var(--text)", lineHeight: "1.8" }}
                  className="prose-notes text-sm max-w-2xl"
                  dangerouslySetInnerHTML={{
                    __html: notesStream
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n\n/g, "</p><p>")
                      .replace(/\n/g, "<br/>")
                      .replace(/^/, "<p>")
                      .replace(/$/, "</p>"),
                  }}
                />
              ) : !gettingNotes ? (
                <div className="text-center py-20">
                  <p style={{ color: "var(--muted)" }} className="mb-6">
                    Write something first, then ask for editorial notes.
                  </p>
                  <button
                    onClick={getEditorNotes}
                    style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                    className="px-6 py-2 rounded font-bold text-sm hover:opacity-80"
                  >
                    Get editor notes
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

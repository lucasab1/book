import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, ChapterFile } from "../lib/api";
import ChapterSidebar from "../components/layout/ChapterSidebar";
import ControlPanel from "../components/layout/ControlPanel";
import { Plus } from "lucide-react";

export default function ManuscriptPage() {
  const [chapters, setChapters] = useState<ChapterFile[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBrief, setNewBrief] = useState("");

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    setChapters(await api.chaptersList());
  }

  async function addChapter() {
    if (!newTitle.trim()) return;
    await api.chaptersCreate({ title: newTitle.trim(), brief: newBrief.trim() });
    setNewTitle(""); setNewBrief(""); setShowNew(false);
    loadChapters();
  }

  const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);

  return (
    <div className="flex h-full w-full overflow-hidden">
      
      {/* COLUMN A: Chapter Navigation */}
      <ChapterSidebar chapters={chapters} />

      {/* COLUMN B: Manuscript Overview */}
      <main className="flex-1 flex flex-col overflow-y-auto px-12 py-16" style={{ background: "var(--bg)" }}>
        <div className="max-w-[800px] mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl font-serif font-bold mb-2 text-[var(--text)]">Manuscript Overview</h1>
            <p className="text-sm text-[var(--text)]/40 tracking-widest uppercase font-bold">
              {chapters.length} chapters · {totalWords.toLocaleString()} words
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {chapters.map((ch, i) => (
              <Link 
                key={ch.slug} 
                to={`/manuscript/chapter/${ch.slug}`}
                className="group flex items-center justify-between p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:scale-[1.01] hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-[var(--text)]/20 font-mono">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-serif text-lg font-bold group-hover:text-[var(--accent)] transition-colors text-[var(--text)]">{ch.title}</h3>
                    {ch.brief && <p className="text-[11px] text-[var(--text)]/40 mt-1 line-clamp-1">{ch.brief}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[var(--text)]/40">{(ch.wordCount/1000).toFixed(1)}k words</span>
                </div>
              </Link>
            ))}

            <button 
              onClick={() => setShowNew(true)}
              className="w-full flex items-center justify-center gap-3 p-6 border border-dashed border-[var(--border)] rounded-2xl text-[var(--text)]/40 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all group"
            >
              <Plus size={20} className="group-hover:scale-125 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">New Chapter</span>
            </button>
          </div>

          {showNew && (
            <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-lg mb-6 text-[var(--text)]">New Chapter</h3>
              <input 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                placeholder="Title" 
                autoFocus
                className="w-full px-5 py-3 bg-[var(--text)]/5 rounded-xl text-sm outline-none focus:ring-2 ring-[var(--accent)]/30 mb-4 text-[var(--text)]"
                onKeyDown={(e) => e.key === "Enter" && addChapter()} 
              />
              <textarea 
                value={newBrief} 
                onChange={(e) => setNewBrief(e.target.value)} 
                rows={3} 
                placeholder="Chapter brief..."
                className="w-full px-5 py-3 bg-[var(--text)]/5 rounded-xl text-sm outline-none focus:ring-2 ring-[var(--accent)]/30 mb-6 resize-none text-[var(--text)]"
              />
              <div className="flex gap-4">
                <button onClick={addChapter} className="flex-1 py-3 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-widest rounded-xl">Create</button>
                <button onClick={() => setShowNew(false)} className="px-6 py-3 text-xs font-bold text-[var(--text)]/40 uppercase tracking-widest">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COLUMN C: General Stats */}
      <ControlPanel 
        chapters={chapters} 
        totalWords={totalWords} 
        chapterBrief=""
        onBriefChange={() => {}}
        onActionClick={(action) => console.log("Action:", action)}
      />
    </div>
  );
}

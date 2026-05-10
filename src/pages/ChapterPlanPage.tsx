import { useState, useEffect } from "react";
import { api, ChapterFile } from "../lib/api";
import { MoveHorizontal, Plus } from "lucide-react";

export default function ChapterPlanPage() {
  const [chapters, setChapters] = useState<ChapterFile[]>([]);

  useEffect(() => {
    api.chaptersList().then(setChapters);
  }, []);

  return (
    <main className="flex-1 overflow-x-auto p-12 bg-[var(--bg)]">
      <div className="flex items-center justify-between mb-12 min-w-max">
        <h1 className="text-4xl font-serif font-bold text-[var(--text)]">Chapter Plan</h1>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-[var(--text)]/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--text)]/40">
            {chapters.length} Scenes / Cards
          </div>
        </div>
      </div>

      <div className="flex gap-6 pb-8 items-start min-w-max">
        {chapters.map((ch, i) => (
          <div key={ch.slug} className="w-80 shrink-0 group">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text)]/20">Chapter {i + 1}</span>
              <MoveHorizontal size={14} className="text-[var(--text)]/10 group-hover:text-[var(--text)]/40 transition-colors cursor-move" />
            </div>
            
            <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all cursor-pointer">
              <h3 className="font-serif text-lg font-bold mb-3 group-hover:text-[var(--accent)] transition-colors text-[var(--text)]">{ch.title}</h3>
              <p className="text-[11px] leading-[1.6] text-[var(--text)]/60 line-clamp-6 mb-4">
                {ch.brief || "No brief established for this scene yet. Click to edit or ask the Editor to draft one."}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text)]/30">{(ch.wordCount/1000).toFixed(1)}k words</span>
                <div className={`w-1.5 h-1.5 rounded-full ${ch.wordCount > 0 ? 'bg-green-500' : 'bg-[var(--text)]/5'}`} />
              </div>
            </div>
          </div>
        ))}

        <button className="w-80 shrink-0 h-40 border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-3 text-[var(--text)]/20 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all group">
          <Plus size={24} className="group-hover:scale-125 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Add Scene</span>
        </button>
      </div>
    </main>
  );
}

import { PenTool } from "lucide-react";
import { ChapterFile } from "../../lib/api";

interface Props {
  chapters: ChapterFile[];
  currentSlug?: string;
  totalWords: number;
  chapterBrief: string;
  onBriefChange: (val: string) => void;
  onActionClick: (action: string) => void;
}

export default function ControlPanel({ 
  chapters, 
  currentSlug, 
  totalWords, 
  chapterBrief, 
  onBriefChange,
  onActionClick 
}: Props) {
  const currentIndex = chapters.findIndex(c => c.slug === currentSlug) + 1;

  return (
    <aside className="w-72 flex flex-col shrink-0 border-l border-[var(--border)] p-8 overflow-y-auto bg-[var(--bg)]">
      <section className="mb-12">
        <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text)]/30 mb-4">Manuscript</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-[var(--text)] tracking-tighter">{(totalWords/1000).toFixed(1)}k</span>
          <span className="text-xs font-bold text-[var(--text)]/40">{chapters.length} chapters</span>
        </div>
        
        <div className="mt-8 space-y-3">
          {chapters.slice(0, 10).map((ch, i) => (
            <div key={ch.slug} className={`flex justify-between items-center text-[10px] font-medium ${ch.slug === currentSlug ? 'text-[var(--text)]' : 'text-[var(--text)]/40'}`}>
              <span className="truncate pr-4">Ch {i+1}: {ch.title}</span>
              <span className="opacity-60">{(ch.wordCount/1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 mb-12">
        <button 
          onClick={() => onActionClick("Ask the Editor")}
          className="w-full py-3 bg-[var(--text)] text-[var(--bg)] text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-black/10 hover:scale-[1.02] transition-all active:scale-95"
        >
          Ask the Editor...
        </button>
        {[
          `Polish / Lyric Pass — Ch ${currentIndex}`,
          `Refine Writing Profile — Ch ${currentIndex}`,
          `⚠️ Refresh Bible — Ch ${currentIndex}`,
          `Export Chapter — Ch ${currentIndex}`,
          `Export Manuscript`,
        ].map((action, i) => (
          <button 
            key={i} 
            onClick={() => onActionClick(action)}
            className="w-full py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[10px] font-bold rounded-xl hover:bg-[var(--text)]/5 transition-all text-left px-4"
          >
            {action}
          </button>
        ))}
      </section>

      <section className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text)]/30">Chapter Notes</h3>
            <PenTool size={12} className="text-[var(--text)]/20" />
          </div>
          <textarea 
            value={chapterBrief}
            onChange={(e) => onBriefChange(e.target.value)}
            placeholder="Chapter specific notes..."
            className="w-full h-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-[11px] font-serif leading-relaxed text-[var(--text)] outline-none focus:ring-1 ring-[var(--accent)]/30 resize-none"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text)]/30">General Notes</h3>
            <PenTool size={12} className="text-[var(--text)]/20" />
          </div>
          <textarea 
            value={globalNotes}
            onChange={(e) => onGlobalNotesChange(e.target.value)}
            placeholder="Global story notes and reminders..."
            className="w-full h-40 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-[11px] font-serif leading-relaxed text-[var(--text)] outline-none focus:ring-1 ring-[var(--accent)]/30 resize-none"
          />
        </div>
      </section>
    </aside>
  );
}

import { Link, useParams } from "react-router-dom";
import { ChapterFile } from "../../lib/api";

interface Props {
  chapters: ChapterFile[];
  currentSlug?: string;
}

export default function ChapterSidebar({ chapters, currentSlug }: Props) {
  return (
    <aside className="w-56 flex flex-col shrink-0 text-[var(--text)]/70 border-r border-[var(--border)] overflow-hidden" style={{ background: "var(--surface)" }}>
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-40 mb-8">Chapters</h3>
        
        <div className="space-y-1">
          {chapters.map((ch, i) => {
            const active = ch.slug === currentSlug;
            const chapterNum = i + 1;
            return (
              <Link 
                key={ch.slug} 
                to={`/manuscript/chapter/${ch.slug}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${active ? 'bg-[var(--text)] text-[var(--bg)] shadow-lg shadow-black/5' : 'hover:bg-[var(--text)]/5 hover:text-[var(--text)]'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ch.wordCount > 0 ? 'bg-green-500' : 'bg-[var(--text)]/10'}`} />
                <span className={`truncate font-medium text-[11px] ${active ? 'font-bold' : ''}`}>
                  {chapterNum}. {ch.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

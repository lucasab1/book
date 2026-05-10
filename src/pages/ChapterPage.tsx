import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, ChapterFile } from "../lib/api";
import { useAI } from "../lib/context/AIContext";

export default function ChapterPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [saved, setSaved] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [chapters, setChapters] = useState<ChapterFile[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { sendMessage, setPanelOpen } = useAI();

  useEffect(() => {
    loadChapters();
    if (!slug) return;
    api.chaptersGet(slug).then((data) => {
      if (!data) { navigate("/manuscript"); return; }
      setTitle(data.title || slug);
      setBrief(data.brief || "");
      setContent(data.content || "");
      setLoaded(true);
    });
  }, [slug, navigate]);

  async function loadChapters() {
    setChapters(await api.chaptersList());
  }

  function scheduleSave(c: string, t: string, b: string) {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await api.chaptersSave(slug!, c, { title: t, brief: b });
      setSaved(true);
    }, 1000);
  }

  if (!loaded) return (
    <div style={{ background: "var(--bg)", color: "var(--muted)", minHeight: "100vh" }} className="flex items-center justify-center text-sm font-black uppercase tracking-widest">Loading...</div>
  );

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const currentIdx = chapters.findIndex(c => c.slug === slug);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* 1. Main App Header (from the print) */}
      <header style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-2 shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xs tracking-[0.2em] font-black uppercase opacity-60">bookmoth</Link>
          <div className="flex items-center bg-surface border border-border rounded px-3 py-1 gap-2">
             <span className="text-[10px] opacity-40">▼</span>
             <span className="text-[10px] font-black uppercase tracking-widest">{title || "Untitled"}</span>
          </div>
        </div>

        {/* Tab-style Navigation */}
        <div className="flex items-center gap-1">
          {["Brief", "Chapter Plan", "Bible", "Manuscript"].map((tab) => (
            <button 
              key={tab} 
              className={`px-4 py-2 text-[11px] font-bold rounded-md transition-all ${tab === 'Manuscript' ? 'bg-white shadow-sm border border-border' : 'opacity-40 hover:opacity-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
           {["Dark", "Cloud Δ", "API / LLM", "Save", "Load", "Export"].map(btn => (
             <button key={btn} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-border rounded-md hover:bg-surface transition-colors ${btn === 'Export' ? 'bg-accent text-black border-accent' : ''}`}>
               {btn === 'API / LLM' ? 'Claude Code' : btn}
             </button>
           ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* 2. Left Sidebar: Chapters (matches print) */}
        <aside style={{ background: "var(--surface)", borderRight: "1px solid var(--border)", width: "220px" }} className="flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1">Chapters</h2>
            <p className="text-[8px] text-muted italic leading-tight">Right-click a chapter to switch or add versions in manuscript.</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {chapters.map((ch, i) => {
              const active = ch.slug === slug;
              return (
                <Link 
                  key={ch.slug} 
                  to={`/manuscript/chapter/${ch.slug}`}
                  className={`sidebar-item mx-2 mb-0.5 py-2 px-3 ${active ? 'active' : ''}`}
                >
                  <span className="text-[10px] font-black opacity-30 w-4">{i + 1}</span>
                  <span className="truncate flex-1 text-[11px] font-bold">{ch.title}</span>
                  <div className={`status-dot ${ch.wordCount > 0 ? 'green' : 'gray'}`}></div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* 3. Central Column: The Editor and Toolbars (matches print) */}
        <main className="flex-1 overflow-y-auto relative bg-[#fdfaf5]">
          
          {/* Inner Toolbar (the one with Italicise, etc.) */}
          <div className="sticky top-0 z-10 bg-[#fdfaf5]/80 backdrop-blur-sm border-b border-border px-8 py-2 flex items-center justify-between">
             <div className="flex items-center gap-1">
                {["Italicise", "* * *", "— fix", "↶", "↷", "[ ] Focus"].map(tool => (
                  <button key={tool} className="px-3 py-1.5 text-[10px] font-medium text-muted hover:text-text border border-transparent hover:border-border rounded transition-all italic">
                    {tool}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center bg-white border border-border rounded text-[10px] font-black px-2 py-1">v1</div>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">{wordCount.toLocaleString()} w</span>
                <button className="text-[10px] font-black text-muted uppercase tracking-widest hover:text-text">Hide version</button>
             </div>
          </div>

          <div className="max-w-[700px] mx-auto px-12 py-16">
            <div className="mb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60 block mb-2">Chapter {currentIdx + 1}</span>
              <input 
                value={title} 
                onChange={(e) => { setTitle(e.target.value); scheduleSave(content, e.target.value, brief); }}
                style={{ background: "transparent", border: "none", color: "var(--text)" }}
                className="text-4xl font-serif font-bold outline-none w-full placeholder:opacity-10"
                placeholder="Chapter Title"
              />
            </div>

            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); scheduleSave(e.target.value, title, brief); }}
              placeholder="The story begins here..."
              className="manuscript-editor w-full h-[150vh] outline-none bg-transparent resize-none border-none overflow-hidden"
              spellCheck={false}
            />
          </div>
        </main>

        {/* 4. Right Sidebar: Manuscript Stats & Actions (matches print) */}
        <aside style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", width: "240px" }} className="flex flex-col shrink-0">
          <div className="p-6">
            <div className="mb-10">
               <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-2">Manuscript</h3>
               <p className="text-5xl font-serif font-medium text-accent">{(wordCount/1000).toFixed(1)}k</p>
               <p className="text-[10px] font-bold text-muted mt-1">{chapters.length} chapters</p>
               
               <div className="mt-4 space-y-1.5">
                  {chapters.slice(0, 10).map(ch => (
                    <div key={ch.slug} className="flex justify-between items-baseline text-[10px]">
                       <span className={`truncate mr-2 ${ch.slug === slug ? 'font-black text-text' : 'text-muted'}`}>Ch {chapters.indexOf(ch)+1}: {ch.title}</span>
                       <span className="text-muted opacity-60">{(ch.wordCount/1000).toFixed(1)}k</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-2 mb-10">
               <button 
                onClick={() => setPanelOpen(true)}
                className="w-full py-2.5 bg-accent text-black text-[10px] font-black uppercase tracking-widest rounded shadow-sm hover:opacity-90"
               >
                 Ask the Editor...
               </button>
               <button onClick={() => sendMessage(`/write the chapter ${title}`)} className="w-full py-2.5 bg-white border border-border text-text text-[10px] font-bold rounded hover:bg-surface transition-colors">
                 Polish / Lyric Pass — Ch {currentIdx + 1}
               </button>
               <button className="w-full py-2.5 bg-white border border-border text-text text-[10px] font-bold rounded hover:bg-surface transition-colors">
                 Δ Refresh Bible — Ch {currentIdx + 1}
               </button>
               <button className="w-full py-2.5 bg-white border border-border text-text text-[10px] font-bold rounded hover:bg-surface transition-colors">
                 Export Chapter — Ch {currentIdx + 1}
               </button>
               <button className="w-full py-2.5 bg-white border border-border text-text text-[10px] font-bold rounded hover:bg-surface transition-colors">
                 Export Manuscript
               </button>
            </div>

            <div className="mb-6">
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-3">Chapter Notes</h3>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)" }} className="w-full h-32 rounded-lg p-3">
                 <textarea 
                  value={brief} 
                  onChange={(e) => { setBrief(e.target.value); scheduleSave(content, title, e.target.value); }}
                  className="w-full h-full bg-transparent text-[10px] leading-relaxed text-muted resize-none outline-none"
                  placeholder="Notes for the AI editor..."
                />
              </div>
            </div>

            <div>
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-3">General Notes</h3>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)" }} className="w-full h-24 rounded-lg"></div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

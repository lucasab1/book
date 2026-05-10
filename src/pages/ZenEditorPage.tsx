import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
  Italic, 
  Undo, 
  Redo, 
  Maximize2
} from "lucide-react";
import { api, ChapterFile, Skill } from "../lib/api";
import { useAI } from "../lib/context/AIContext";
import ChapterSidebar from "../components/layout/ChapterSidebar";
import ControlPanel from "../components/layout/ControlPanel";

export default function ZenEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { sendMessage, setPanelOpen } = useAI();
  
  const [chapters, setChapters] = useState<ChapterFile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [globalNotes, setGlobalNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveProjectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Theme-aware colors
  const cream = "var(--bg)";
  const charcoal = "var(--text)";

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const applyStyle = (style: "italic" | "bold") => {
    if (!textAreaRef.current) return;
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = textAreaRef.current.value;
    const selected = text.substring(start, end);
    let replacement = "";
    if (style === "italic") replacement = `*${selected}*`;
    const newVal = text.substring(0, start) + replacement + text.substring(end);
    setContent(newVal);
    scheduleSave(newVal, title, brief);
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(start + 1, end + 1);
    }, 10);
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
    }
  }, [content, loaded]);

  useEffect(() => {
    const resetTyping = () => setIsTyping(false);
    window.addEventListener("mousemove", resetTyping);
    return () => window.removeEventListener("mousemove", resetTyping);
  }, []);

  useEffect(() => {
    loadChapters();
    api.projectGet().then(p => {
      if (p) setGlobalNotes(p.globalNotes || "");
    });
    api.skillsList().then(setSkills);
    
    if (slug) {
      api.chaptersGet(slug).then((data) => {
        if (data) {
          setTitle(data.title);
          setContent(data.content || "");
          setBrief(data.brief || "");
          setLoaded(true);
        }
      });
    }
  }, [slug]);

  const loadChapters = async () => {
    const list = await api.chaptersList();
    setChapters(list);
  };

  const handleGlobalNotesChange = (val: string) => {
    setGlobalNotes(val);
    if (saveProjectTimer.current) clearTimeout(saveProjectTimer.current);
    saveProjectTimer.current = setTimeout(async () => {
      const p = await api.projectGet();
      if (p) await api.projectSet({ ...p, globalNotes: val });
    }, 2000);
  };

  const scheduleSave = (c: string, t: string, b: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (slug) {
        await api.chaptersSave(slug, c, { title: t, brief: b });
      }
    }, 2000);
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    scheduleSave(val, title, brief);
    
    // Ambient Mode Trigger
    setIsTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 2500);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(content, val, brief);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const totalWords = chapters.reduce((acc, ch) => acc + ch.wordCount, 0);
  const currentChapterIndex = chapters.findIndex(c => c.slug === slug) + 1;

  const handleAction = (action: string, skillId?: string) => {
    setPanelOpen(true);
    if (action === "Ask the Editor") return;

    let prompt = "";
    if (skillId) {
      prompt = `/skill ${skillId} on chapter ${title}`;
    } else if (action.includes("Polish / Lyric Pass")) {
      prompt = `/write polish and apply lyric pass to chapter ${title}. Use the current brief as guidance.`;
    }
    
    if (prompt) sendMessage(prompt);
  };

  if (!loaded && slug) {
    return <div className="h-full flex items-center justify-center bg-[var(--bg)] font-serif text-[var(--text)]">Loading Manuscript...</div>;
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg)] relative">
      
      {/* COLUMN A: Chapter Navigation */}
      <AnimatePresence>
        {!isTyping && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="shrink-0 flex"
          >
            <ChapterSidebar chapters={chapters} currentSlug={slug} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* COLUMN B: Main Manuscript Editor */}
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-700" style={{ background: cream }}>
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth px-8">
          {/* Floating Toolbar */}
          <AnimatePresence>
            {!isTyping && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="sticky top-6 mx-auto w-fit z-20 flex items-center gap-1 glass-panel p-1 rounded-2xl shadow-elegant"
              >
                {[
                  { icon: <Italic size={16} />, label: "Italicise", action: () => applyStyle("italic") },
                  { label: "* * *", action: () => { setContent(prev => prev + "\n\n* * *\n\n"); } },
                  { icon: <Undo size={16} />, action: () => document.execCommand("undo") },
                  { icon: <Redo size={16} />, action: () => document.execCommand("redo") },
                  { icon: <Maximize2 size={16} />, label: "Focus", action: () => textAreaRef.current?.requestFullscreen() },
                ].map((tool, i) => (
                  <button key={i} onClick={tool.action} className="p-2 hover:bg-[var(--text)]/5 rounded-xl text-[var(--text)]/40 hover:text-[var(--text)] transition-all flex items-center gap-2 px-3">
                    {tool.icon}
                    {tool.label && <span className="text-[10px] font-bold italic">{tool.label}</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-[650px] mx-auto pt-24 pb-40">
            <motion.div 
              animate={{ opacity: isTyping ? 0.3 : 1 }}
              transition={{ duration: 0.5 }}
              className="mb-16 group relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)]">Chapter {currentChapterIndex}</span>
                  <Star size={14} className="text-[var(--accent)] fill-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
                
                {/* Version Controls */}
                <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text)]/40">
                  <div className="flex items-center gap-1 bg-[var(--text)]/5 p-1 rounded-lg">
                    {['v1', 'v2', 'v3'].map(v => (
                      <button key={v} className={`px-2 py-1 rounded-md transition-all ${v === 'v1' ? 'bg-[var(--surface)] shadow-sm text-[var(--text)]' : 'hover:bg-[var(--text)]/5'}`}>{v}</button>
                    ))}
                  </div>
                  <span className="opacity-60">{wordCount.toLocaleString()} w</span>
                </div>
              </div>
              <input 
                value={title}
                onChange={handleTitleChange}
                placeholder="Chapter Title"
                className="w-full bg-transparent border-none outline-none manuscript-editor text-5xl font-medium text-[var(--text)] placeholder:opacity-10 tracking-tight"
              />
            </motion.div>

            <textarea 
              ref={textAreaRef}
              value={content}
              onChange={handleEditorChange}
              placeholder="The drive back lasted twenty-three minutes. Martin knew this because he counted the seconds..."
              className="w-full min-h-[600px] bg-transparent border-none outline-none manuscript-editor text-[1.35rem] leading-[2.2] text-[var(--text)] placeholder:opacity-20 resize-none overflow-hidden"
              spellCheck={false}
            />
          </div>

          {/* Bottom Right Word Count & Versions */}
          <AnimatePresence>
            {!isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-8 right-[calc(350px+288px+32px)] flex items-center gap-4 bg-[var(--surface)]/50 backdrop-blur-sm border border-[var(--border)] px-4 py-2 rounded-full text-[10px] font-bold text-[var(--text)]/40"
              >
                <div className="flex items-center gap-1">
                  {['v1', 'v2', 'v3'].map(v => (
                    <button key={v} className={`px-2 py-0.5 rounded ${v === 'v1' ? 'bg-[var(--text)] text-[var(--bg)]' : 'hover:bg-[var(--text)]/5'}`}>{v}</button>
                  ))}
                </div>
                <div className="w-px h-3 bg-[var(--text)]/10" />
                <span>{wordCount.toLocaleString()} w</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* COLUMN C: Stats & Context */}
      <AnimatePresence>
        {!isTyping && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="shrink-0 flex"
          >
            <ControlPanel 
              chapters={chapters} 
              currentSlug={slug} 
              totalWords={totalWords} 
              chapterBrief={brief} 
              globalNotes={globalNotes}
              skills={skills}
              onBriefChange={(val) => {
                setBrief(val);
                scheduleSave(content, title, val);
              }}
              onGlobalNotesChange={handleGlobalNotesChange}
              onActionClick={handleAction}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

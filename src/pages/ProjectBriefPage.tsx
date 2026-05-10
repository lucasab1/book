import { useState, useEffect } from "react";
import { api, ProjectMeta } from "../lib/api";

export default function ProjectBriefPage() {
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [form, setForm] = useState({ title: "", genre: "", synopsis: "" });

  useEffect(() => {
    api.projectGet().then((p) => {
      if (p) {
        setProject(p);
        setForm({ title: p.title, genre: p.genre, synopsis: p.synopsis });
      }
    });
  }, []);

  const save = async () => {
    await api.projectSet(form);
    alert("Project brief updated.");
  };

  return (
    <main className="flex-1 overflow-y-auto p-16 bg-[var(--bg)]">
      <div className="max-w-[700px] mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-12 text-[var(--text)]">Project Brief</h1>
        
        <div className="space-y-8">
          <section>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text)]/40 mb-3 block">Target Title</label>
            <input 
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-2xl font-serif border-b border-[var(--border)] bg-transparent py-2 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text)]"
            />
          </section>

          <section>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text)]/40 mb-3 block">Genre & Style</label>
            <input 
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              className="w-full text-lg border-b border-[var(--border)] bg-transparent py-2 outline-none focus:border-[var(--accent)] transition-colors text-[var(--text)]"
            />
          </section>

          <section>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text)]/40 mb-3 block">Premise & Synopsis</label>
            <textarea 
              value={form.synopsis}
              onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
              className="w-full h-60 text-lg leading-relaxed border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-6 outline-none focus:ring-1 ring-[var(--accent)]/30 transition-all resize-none text-[var(--text)]"
            />
          </section>

          <button 
            onClick={save}
            className="px-8 py-3 bg-[var(--accent)] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            Update Brief
          </button>
        </div>
      </div>
    </main>
  );
}

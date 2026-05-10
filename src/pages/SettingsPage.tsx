import { useState, useEffect } from "react";
import AppNav from "../components/AppNav";
import { api, ProviderConfig, CLIProvider } from "../lib/api";

export default function SettingsPage() {
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [available, setAvailable] = useState<Record<string, boolean | null>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { 
    api.providersGet().then(setConfig); 
  }, []);

  async function save() {
    if (!config) return;
    await api.providersSet(config);
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000);
  }

  async function checkProvider(id: string) {
    setChecking((p) => ({ ...p, [id]: true }));
    const { available: ok } = await api.providersCheck(id);
    setAvailable((p) => ({ ...p, [id]: ok }));
    setChecking((p) => ({ ...p, [id]: false }));
  }

  function toggleProvider(id: string) {
    if (!config) return;
    setConfig({ 
      ...config, 
      providers: config.providers.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p) 
    });
  }

  if (!config) return (
    <div style={{ background: "var(--bg)", color: "var(--muted)", minHeight: "100vh" }} className="flex items-center justify-center text-sm font-black uppercase tracking-widest">
      Loading Settings...
    </div>
  );

  return (
    <div className="h-screen w-full overflow-y-auto" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AppNav />
      <main className="max-w-3xl mx-auto px-8 py-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold mb-2">Settings</h1>
            <p className="text-xs font-black uppercase tracking-widest text-muted">Configuration & System Integrity</p>
          </div>
          <button 
            onClick={save} 
            className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg shadow-sm transition-all ${
              saved ? 'bg-green-600 text-white' : 'bg-accent text-black hover:bg-accent-bright'
            }`}
          >
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

        {/* AI Providers Section */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Local CLI Tools</h2>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          <div className="grid gap-6">
            {config.providers.map((p: CLIProvider) => (
              <div key={p.id} className="sidebar-item active group flex-col items-start p-6 gap-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${available[p.id] ? 'bg-green-500' : 'bg-muted opacity-30'}`}></div>
                    <div>
                      <h3 className="text-sm font-bold">{p.name}</h3>
                      <code className="text-[10px] text-muted">{p.command}</code>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => checkProvider(p.id)} 
                      disabled={checking[p.id]}
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-border rounded-md hover:border-accent transition-colors disabled:opacity-50"
                    >
                      {checking[p.id] ? "Verifying..." : "Verify Installation"}
                    </button>
                    <button 
                      onClick={() => toggleProvider(p.id)}
                      className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-md transition-all ${
                        p.enabled ? 'bg-accent text-black' : 'bg-surface2 text-muted border border-border'
                      }`}
                    >
                      {p.enabled ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 w-full pt-4 border-t border-border">
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Capabilities</p>
                    <div className="flex gap-1.5">
                      {p.capabilities.map((c: string) => (
                        <span key={c} className="text-[9px] px-2 py-0.5 bg-black/5 rounded text-muted font-bold uppercase">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Context</p>
                    <span className="text-[10px] font-bold text-accent">{(p.maxContextTokens / 1000).toLocaleString()}k Tokens</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project Storage Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Project Blueprint</h2>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Manuscript Storage", path: "story/*.md", desc: "Your creative output" },
              { label: "Lore & Entities", path: "entities/**/*.json", desc: "Structured world data" },
              { label: "Knowledge Assets", path: "kb/**/*.md", desc: "Author notes and bibles" },
              { label: "Project Core", path: "project.json", desc: "Metadata and settings" }
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-border bg-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{s.label}</p>
                <code className="text-[10px] block mb-2 opacity-60">{s.path}</code>
                <p className="text-[10px] text-muted italic">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

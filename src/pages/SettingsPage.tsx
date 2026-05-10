import { useState, useEffect } from "react";
import AppNav from "../components/AppNav";
import { api, ProviderConfig, CLIProvider } from "../lib/api";

const TASK_LABELS: Record<string, string> = { write: "Prose writing", summarize: "Summarization", analyze: "Analysis", critique: "Critique", extract: "Fact extraction" };

export default function SettingsPage() {
  const [config, setConfig] = useState<ProviderConfig | null>(null);
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [available, setAvailable] = useState<Record<string, boolean | null>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.providersGet().then(setConfig); }, []);

  async function save() {
    if (!config) return;
    await api.providersSet(config);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function checkProvider(id: string) {
    setChecking((p) => ({ ...p, [id]: true }));
    const { available: ok } = await api.providersCheck(id);
    setAvailable((p) => ({ ...p, [id]: ok }));
    setChecking((p) => ({ ...p, [id]: false }));
  }

  function toggleProvider(id: string) {
    if (!config) return;
    setConfig({ ...config, providers: config.providers.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p) });
  }

  function setDefault(task: string, providerId: string) {
    if (!config) return;
    setConfig({ ...config, defaultProviders: { ...config.defaultProviders, [task]: providerId } });
  }

  if (!config) return <div style={{ background: "var(--bg)", color: "var(--muted)", minHeight: "100vh" }} className="flex items-center justify-center text-sm">Loading…</div>;

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <AppNav />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button onClick={save} style={{ background: "var(--accent)", color: "#000" }} className="text-sm px-5 py-2 rounded font-bold">
            {saved ? "Saved ✓" : "Save settings"}
          </button>
        </div>

        <section className="mb-12">
          <h2 className="text-lg font-bold mb-2">AI Providers</h2>
          <p style={{ color: "var(--muted)" }} className="text-sm mb-6 leading-relaxed">Bookmoth uses CLI tools — no API calls. Enable providers installed on your system.</p>
          <div className="flex flex-col gap-4">
            {config.providers.map((p: CLIProvider) => (
              <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold">{p.name}</h3>
                      <span style={{ background: "var(--surface2)", color: "var(--muted)" }} className="text-xs px-2 py-0.5 rounded font-mono">{p.command} {p.args.join(" ")}</span>
                      <span style={{ color: p.costTier === "free" ? "#7ec97e" : p.costTier === "pro" ? "var(--accent)" : "#c97e7e" }} className="text-xs font-bold">{p.costTier}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {p.capabilities.map((c: string) => <span key={c} style={{ background: "var(--surface2)", color: "var(--muted)" }} className="text-xs px-1.5 py-0.5 rounded">{c}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {available[p.id] !== undefined && (
                      <span style={{ color: available[p.id] ? "#7ec97e" : "#c97e7e" }} className="text-xs font-bold">{available[p.id] ? "✓ available" : "✗ not found"}</span>
                    )}
                    <button onClick={() => checkProvider(p.id)} disabled={checking[p.id]}
                      style={{ border: "1px solid var(--border)", color: "var(--muted)" }} className="text-xs px-3 py-1 rounded disabled:opacity-50">
                      {checking[p.id] ? "Checking…" : "Check"}
                    </button>
                    <button onClick={() => toggleProvider(p.id)}
                      style={{ background: p.enabled ? "var(--accent)" : "var(--surface2)", color: p.enabled ? "#000" : "var(--muted)", border: "1px solid var(--border)" }}
                      className="text-xs px-3 py-1 rounded font-bold">{p.enabled ? "Enabled" : "Disabled"}</button>
                  </div>
                </div>
                <p style={{ color: "var(--muted)" }} className="text-xs">Max context: {p.maxContextTokens.toLocaleString()} tokens</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-bold mb-2">Task routing</h2>
          <p style={{ color: "var(--muted)" }} className="text-sm mb-6">Assign the best provider for each task type.</p>
          <div className="flex flex-col gap-3">
            {Object.keys(TASK_LABELS).map((task) => (
              <div key={task} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded p-4 flex items-center justify-between">
                <div><p className="font-bold text-sm">{TASK_LABELS[task]}</p><p style={{ color: "var(--muted)" }} className="text-xs capitalize">{task}</p></div>
                <select value={config.defaultProviders[task] || ""}
                  onChange={(e) => setDefault(task, e.target.value)}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  className="text-sm px-3 py-2 rounded outline-none">
                  {config.providers.filter((p: CLIProvider) => p.capabilities.includes(task)).map((p: CLIProvider) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Storage</h2>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[{ label: "Chapters", path: "story/*.md" }, { label: "Entities", path: "entities/**/*.json" }, { label: "Knowledge base", path: "kb/**/*.md" }, { label: "Working files", path: "work/" }, { label: "Provider config", path: ".bookmoth/providers.json" }].map((s) => (
                <div key={s.label}><p className="font-bold">{s.label}</p><code style={{ color: "var(--muted)" }} className="text-xs">{s.path}</code></div>
              ))}
            </div>
            <p style={{ color: "var(--muted)" }} className="text-xs mt-4 leading-relaxed">All data stored as plain files. Commit to Git for version history.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

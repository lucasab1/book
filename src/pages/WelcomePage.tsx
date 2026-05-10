import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Step = "home" | "create" | "open";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("home");
  const [recents, setRecents] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Create form
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.projectGetRecents().then((r) => setRecents(r ?? []));
  }, []);

  async function pickFolder() {
    const p = await api.projectPickFolder();
    if (p) setFolderPath(p);
  }

  async function create() {
    if (!title.trim() || !folderPath) return;
    setCreating(true);
    setError("");
    const res = await api.projectCreate(folderPath, { title: title.trim(), genre: genre.trim(), synopsis: synopsis.trim() });
    setCreating(false);
    if (res?.ok) {
      navigate("/manuscript", { replace: true });
    } else {
      setError("Could not create project.");
    }
  }

  async function openRecent(p: string) {
    const res = await api.projectOpen(p);
    if (res?.ok) navigate("/manuscript", { replace: true });
    else setError(res?.error ?? "Could not open project.");
  }

  async function openFolder() {
    const p = await api.projectPickFolder();
    if (!p) return;
    const res = await api.projectOpen(p);
    if (res?.ok) navigate("/manuscript", { replace: true });
    else setError(res?.error ?? "No project.json found.");
  }

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }} className="flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <h1 style={{ color: "var(--accent)" }} className="text-3xl font-bold tracking-widest uppercase mb-2 text-center">Bookmoth</h1>
        <p style={{ color: "var(--muted)" }} className="text-sm text-center mb-10">Your novel writing workspace</p>

        {error && (
          <div style={{ background: "var(--surface)", border: "1px solid #c97e7e", color: "#c97e7e" }} className="rounded p-3 text-sm mb-6">{error}</div>
        )}

        {step === "home" && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setStep("create")}
              style={{ background: "var(--accent)", color: "#000" }}
              className="w-full py-3 rounded font-bold text-sm">
              + New project
            </button>
            <button onClick={openFolder}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              className="w-full py-3 rounded text-sm hover:opacity-80">
              Open project folder…
            </button>

            {recents.length > 0 && (
              <div style={{ border: "1px solid var(--border)" }} className="rounded-lg mt-4 overflow-hidden">
                <p style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }} className="text-xs px-4 py-2 uppercase tracking-widest">Recent</p>
                {recents.map((p) => {
                  const parts = p.replace(/\\/g, "/").split("/");
                  const name = parts[parts.length - 1];
                  const parent = parts.slice(0, -1).join("/");
                  return (
                    <button key={p} onClick={() => openRecent(p)}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="w-full text-left px-4 py-3 hover:opacity-80 flex flex-col last:border-0">
                      <span className="font-bold text-sm">{name}</span>
                      <span style={{ color: "var(--muted)" }} className="text-xs truncate">{parent}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "create" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-6">
            <h2 className="font-bold mb-5">New project</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label style={{ color: "var(--muted)" }} className="text-xs block mb-1">Project title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="My Novel"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600" />
              </div>

              <div>
                <label style={{ color: "var(--muted)" }} className="text-xs block mb-1">Genre</label>
                <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Fantasy, Sci-fi, Literary fiction…"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600" />
              </div>

              <div>
                <label style={{ color: "var(--muted)" }} className="text-xs block mb-1">Synopsis</label>
                <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={3} placeholder="Brief description…"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "none" }}
                  className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600" />
              </div>

              <div>
                <label style={{ color: "var(--muted)" }} className="text-xs block mb-1">Project folder *</label>
                <div className="flex gap-2">
                  <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: folderPath ? "var(--text)" : "var(--muted)" }}
                    className="flex-1 px-3 py-2 rounded text-sm truncate">
                    {folderPath || "No folder selected"}
                  </div>
                  <button onClick={pickFolder}
                    style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                    className="text-xs px-3 py-2 rounded hover:opacity-80 shrink-0">Browse…</button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={create} disabled={!title.trim() || !folderPath || creating}
                style={{ background: "var(--accent)", color: "#000" }}
                className="text-sm px-6 py-2 rounded font-bold disabled:opacity-50">
                {creating ? "Creating…" : "Create project"}
              </button>
              <button onClick={() => { setStep("home"); setError(""); }}
                style={{ color: "var(--muted)" }} className="text-sm px-3 py-2">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

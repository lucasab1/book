"use client";
import { useState } from "react";

const COMMANDS = [
  { cmd: "/write", args: "[chapter brief]", desc: "Draft a chapter in your voice" },
  { cmd: "/brainstorm", args: "[topic]", desc: "Explore story ideas and directions" },
  { cmd: "/critique", args: "[filename]", desc: "Get adversarial editorial feedback" },
  { cmd: "/kb", args: "[update notes]", desc: "Create or update a KB entry" },
  { cmd: "/outline", args: "", desc: "Build or refine story structure" },
  { cmd: "/character", args: "[name + request]", desc: "Simulate voice or check consistency" },
  { cmd: "/continuity", args: "[filename]", desc: "Check for continuity errors vs. KB" },
];

export default function ClaudeCodePanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? "var(--surface2)" : "transparent",
          border: "1px solid var(--border)",
          color: open ? "var(--accent)" : "var(--muted)",
        }}
        className="flex items-center gap-2 text-xs px-3 py-2 rounded hover:opacity-80 transition-all"
        title="Claude Code commands"
      >
        <span className="font-mono">claude</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d={open ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "340px",
            zIndex: 50,
          }}
          className="rounded-lg p-4 shadow-2xl"
        >
          <p style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest mb-3">
            Claude Code slash commands
          </p>
          <p style={{ color: "var(--muted)" }} className="text-xs mb-4 leading-relaxed">
            Run <code style={{ color: "var(--text)" }}>claude</code> in your terminal. These commands use your Claude Pro plan.
          </p>
          <div className="flex flex-col gap-2">
            {COMMANDS.map((c) => (
              <div key={c.cmd} className="flex gap-2 items-start">
                <code style={{ color: "var(--accent)", minWidth: "100px" }} className="text-xs font-bold">
                  {c.cmd}
                </code>
                <p style={{ color: "var(--muted)" }} className="text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }} className="mt-4 pt-4 text-xs">
            Files: <code style={{ color: "var(--text)" }}>story/*.md</code> · <code style={{ color: "var(--text)" }}>kb/**</code> · <code style={{ color: "var(--text)" }}>work/</code>
          </div>
        </div>
      )}
    </>
  );
}

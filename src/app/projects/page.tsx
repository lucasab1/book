"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getProjects, deleteProject, getApiKey } from "@/lib/storage";
import { Project } from "@/lib/types";
import ApiKeyModal from "@/components/ApiKeyModal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
    if (!getApiKey()) setShowApiModal(true);
  }, []);

  function handleDelete(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    deleteProject(id);
    setProjects(getProjects());
  }

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      {showApiModal && (
        <ApiKeyModal onSave={() => setShowApiModal(false)} />
      )}

      {/* Nav */}
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-between px-8 py-5"
      >
        <Link href="/" style={{ color: "var(--accent)" }} className="text-xl tracking-widest uppercase font-bold">
          Bookmoth
        </Link>
        <button
          onClick={() => setShowApiModal(true)}
          style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
          className="text-xs px-4 py-2 rounded hover:opacity-80 transition-opacity"
        >
          API key
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your manuscripts</h1>
            <p style={{ color: "var(--muted)" }} className="text-sm">
              {projects.length === 0 ? "No projects yet." : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/projects/new"
            style={{ background: "var(--accent)", color: "#000" }}
            className="px-6 py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity"
          >
            New project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div
            style={{ border: "1px dashed var(--border)" }}
            className="rounded-lg py-24 text-center"
          >
            <p style={{ color: "var(--muted)" }} className="mb-6 text-lg">
              Start your first manuscript.
            </p>
            <Link
              href="/projects/new"
              style={{ background: "var(--accent)", color: "#000" }}
              className="px-8 py-3 rounded font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Create project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((p) => (
                <div
                  key={p.id}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  className="rounded-lg p-6 flex items-start justify-between group"
                >
                  <Link href={`/projects/${p.id}`} className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold mb-1 group-hover:opacity-80 transition-opacity">
                      {p.title}
                    </h2>
                    <p style={{ color: "var(--muted)" }} className="text-sm mb-3 truncate">
                      {p.genre && <span className="mr-3 italic">{p.genre}</span>}
                      {p.synopsis && p.synopsis.slice(0, 100)}
                    </p>
                    <div style={{ color: "var(--muted)" }} className="flex gap-4 text-xs">
                      <span>{p.chapters.length} chapter{p.chapters.length !== 1 ? "s" : ""}</span>
                      <span>{p.voiceProfile ? "Voice analyzed" : "No voice profile"}</span>
                      <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{ color: "var(--muted)" }}
                    className="ml-4 text-xs hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

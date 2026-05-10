"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveProject, generateId } from "@/lib/storage";
import { Project } from "@/lib/types";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("");

  function handleCreate() {
    if (!title.trim()) {
      alert("Project title is required.");
      return;
    }
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId(),
      title: title.trim(),
      genre: genre.trim(),
      synopsis: synopsis.trim(),
      voiceProfile: null,
      sampleText: "",
      chapters: [],
      createdAt: now,
      updatedAt: now,
    };
    saveProject(project);
    router.push(`/projects/${project.id}`);
  }

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-between px-8 py-5"
      >
        <Link href="/" style={{ color: "var(--accent)" }} className="text-xl tracking-widest uppercase font-bold">
          Bookmoth
        </Link>
        <Link href="/projects" style={{ color: "var(--muted)" }} className="text-sm hover:opacity-80">
          ← Back to projects
        </Link>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-12">New project</h1>

        <div className="flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold tracking-wide">Title *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The name of your novel"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              className="px-4 py-3 rounded text-base outline-none focus:border-amber-600"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold tracking-wide">Genre</span>
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Literary fiction, thriller, fantasy…"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
              className="px-4 py-3 rounded text-base outline-none focus:border-amber-600"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold tracking-wide">Synopsis</span>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              rows={5}
              placeholder="A brief description of your novel — premise, main characters, central conflict."
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                resize: "vertical",
              }}
              className="px-4 py-3 rounded text-base outline-none focus:border-amber-600 leading-relaxed"
            />
          </label>

          <button
            onClick={handleCreate}
            style={{ background: "var(--accent)", color: "#000" }}
            className="w-full py-3 rounded font-bold text-base hover:opacity-90 transition-opacity mt-4"
          >
            Create project
          </button>
        </div>
      </main>
    </div>
  );
}

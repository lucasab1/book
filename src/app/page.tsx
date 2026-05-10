import Link from "next/link";

export default function Home() {
  return (
    <main style={{ background: "var(--bg)", color: "var(--text)" }} className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-8 py-5">
        <span style={{ color: "var(--accent)" }} className="text-xl tracking-widest uppercase font-bold">
          Bookmoth
        </span>
        <Link
          href="/manuscript"
          style={{ background: "var(--accent)", color: "#000" }}
          className="text-sm px-5 py-2 rounded font-bold tracking-wide hover:opacity-90 transition-opacity"
        >
          Open manuscript
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32">
        <p style={{ color: "var(--accent)", letterSpacing: "0.3em" }} className="text-xs uppercase mb-6">
          AI for novelists — powered by Claude Code
        </p>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-3xl mb-8">
          Write in{" "}
          <span style={{ color: "var(--accent)" }} className="italic">your voice</span>.
          <br />
          Not AI&apos;s.
        </h1>
        <p style={{ color: "var(--muted)" }} className="text-xl max-w-xl mb-12 leading-relaxed">
          A file-based manuscript editor that integrates with Claude Code. Draft
          chapters, brainstorm, get critique — all through slash commands that
          use your existing Claude Pro subscription.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/manuscript"
            style={{ background: "var(--accent)", color: "#000" }}
            className="text-base px-8 py-3 rounded font-bold tracking-wide hover:opacity-90 transition-opacity"
          >
            Open manuscript
          </Link>
          <a
            href="#commands"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
            className="text-base px-8 py-3 rounded font-bold tracking-wide hover:opacity-80 transition-opacity"
          >
            Claude Code commands
          </a>
        </div>
      </section>

      {/* Claude Code commands */}
      <section id="commands" style={{ borderTop: "1px solid var(--border)" }} className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p style={{ color: "var(--accent)", letterSpacing: "0.3em" }} className="text-xs uppercase text-center mb-4">
            Claude Code slash commands
          </p>
          <p style={{ color: "var(--muted)" }} className="text-center text-sm mb-16">
            Run these in your terminal with <code style={{ color: "var(--accent)" }}>claude</code>.
            They use your Claude Pro plan — no extra API costs.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { cmd: "/brainstorm", desc: "Explore story ideas, plot directions, character options" },
              { cmd: "/write", desc: "Draft prose in your exact voice from a chapter brief" },
              { cmd: "/critique", desc: "Adversarial developmental feedback on any passage" },
              { cmd: "/kb", desc: "Create or update knowledge base entries (characters, world, timeline)" },
              { cmd: "/outline", desc: "Build or refine your story structure at any level" },
              { cmd: "/character", desc: "Simulate character voice, develop psychology, check consistency" },
              { cmd: "/continuity", desc: "Check a chapter against the KB for continuity errors" },
            ].map((c) => (
              <div
                key={c.cmd}
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                className="rounded p-5 flex gap-4"
              >
                <code style={{ color: "var(--accent)" }} className="text-sm font-bold shrink-0 w-32">
                  {c.cmd}
                </code>
                <p style={{ color: "var(--muted)" }} className="text-sm leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }} className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p style={{ color: "var(--accent)", letterSpacing: "0.3em" }} className="text-xs uppercase text-center mb-16">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: "01",
                title: "Organize in the UI",
                desc: "Add chapters and briefs in the manuscript editor. Files are saved as Markdown in story/, kb/, and work/ directories.",
              },
              {
                num: "02",
                title: "Write with Claude Code",
                desc: 'Open a terminal, run claude, and use /write, /brainstorm, or /critique. Claude reads your manuscript files and writes back to them.',
              },
              {
                num: "03",
                title: "Edit and refine",
                desc: "Your AI-written drafts appear in the editor. Edit freely — everything is plain Markdown that you own.",
              },
            ].map((step) => (
              <div key={step.num}>
                <span style={{ color: "var(--accent)" }} className="text-4xl font-bold block mb-4">
                  {step.num}
                </span>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p style={{ color: "var(--muted)" }} className="leading-relaxed text-sm">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }} className="py-6 text-center text-xs">
        Bookmoth — file-based, voice-first writing with Claude Code
      </footer>
    </main>
  );
}

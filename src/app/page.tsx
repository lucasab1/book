import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{ background: "var(--bg)", color: "var(--text)" }}
      className="min-h-screen flex flex-col"
    >
      {/* Nav */}
      <nav
        style={{ borderBottom: "1px solid var(--border)" }}
        className="flex items-center justify-between px-8 py-5"
      >
        <span style={{ color: "var(--accent)" }} className="text-xl tracking-widest uppercase font-bold">
          Bookmoth
        </span>
        <Link
          href="/projects"
          style={{
            background: "var(--accent)",
            color: "#000",
          }}
          className="text-sm px-5 py-2 rounded font-bold tracking-wide hover:opacity-90 transition-opacity"
        >
          Open app
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32">
        <p
          style={{ color: "var(--accent)", letterSpacing: "0.3em" }}
          className="text-xs uppercase mb-6"
        >
          AI for novelists
        </p>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-3xl mb-8">
          AI that writes in{" "}
          <span
            style={{ color: "var(--accent)" }}
            className="italic"
          >
            your voice
          </span>
          , not its own.
        </h1>
        <p
          style={{ color: "var(--muted)" }}
          className="text-xl max-w-xl mb-12 leading-relaxed"
        >
          Paste a sample of your prose. Bookmoth analyzes your sentence rhythms,
          vocabulary, and dialogue instincts — then drafts chapters that sound
          like you wrote them.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/projects"
            style={{
              background: "var(--accent)",
              color: "#000",
            }}
            className="text-base px-8 py-3 rounded font-bold tracking-wide hover:opacity-90 transition-opacity"
          >
            Start writing
          </Link>
          <a
            href="#how-it-works"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
            className="text-base px-8 py-3 rounded font-bold tracking-wide hover:opacity-80 transition-opacity"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{ borderTop: "1px solid var(--border)" }}
        className="py-24 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <p
            style={{ color: "var(--accent)", letterSpacing: "0.3em" }}
            className="text-xs uppercase text-center mb-16"
          >
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: "01",
                title: "Analyze your voice",
                desc: "Paste 500+ words of your writing. Bookmoth maps your sentence rhythms, vocabulary register, dialogue patterns, and narrative quirks into a precise voice profile.",
              },
              {
                num: "02",
                title: "Brief your chapter",
                desc: "Tell Bookmoth what happens in the chapter — who's in the scene, what changes, the emotional beat. A few sentences is enough.",
              },
              {
                num: "03",
                title: "Draft in your voice",
                desc: "Bookmoth writes the full chapter using your voice profile and manuscript context. You edit, refine, and steer — it executes.",
              },
            ].map((step) => (
              <div key={step.num}>
                <span
                  style={{ color: "var(--accent)" }}
                  className="text-4xl font-bold block mb-4"
                >
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

      {/* Features */}
      <section
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
        className="py-24 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <p
            style={{ color: "var(--accent)", letterSpacing: "0.3em" }}
            className="text-xs uppercase text-center mb-16"
          >
            Features
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Voice profile",
                desc: "Deep analysis of sentence rhythm, vocabulary register, dialogue style, and narrative tone — not a vague style preset.",
              },
              {
                title: "Chapter drafting",
                desc: "Full chapter drafts from a brief, using your voice profile and the full manuscript context.",
              },
              {
                title: "Editor notes",
                desc: "Ask the editor for structural, tonal, and craft-level notes on any chapter — like a developmental editor who knows your work.",
              },
              {
                title: "Local-first",
                desc: "All your manuscripts, voice profiles, and chapters are stored in your browser. No account, no cloud, no data sent anywhere except your own API key.",
              },
              {
                title: "Bring your own key",
                desc: "Use your own Anthropic API key. A full novel typically costs $8–15 in API usage.",
              },
              {
                title: "Multi-project",
                desc: "Manage multiple manuscripts with separate voice profiles, synopses, and chapter lists.",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{ border: "1px solid var(--border)", background: "var(--surface2)" }}
                className="p-6 rounded"
              >
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p style={{ color: "var(--muted)" }} className="text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{ borderTop: "1px solid var(--border)" }}
        className="py-24 px-6 text-center"
      >
        <h2 className="text-3xl font-bold mb-6">Ready to write?</h2>
        <p style={{ color: "var(--muted)" }} className="mb-10 text-lg">
          Your voice. Your manuscript. Your API key.
        </p>
        <Link
          href="/projects"
          style={{ background: "var(--accent)", color: "#000" }}
          className="text-base px-10 py-3 rounded font-bold tracking-wide hover:opacity-90 transition-opacity"
        >
          Start writing
        </Link>
      </section>

      <footer
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
        className="py-6 text-center text-xs"
      >
        Bookmoth — local-first, voice-first AI writing for novelists
      </footer>
    </main>
  );
}

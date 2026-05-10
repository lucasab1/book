---
description: Run a character-ripples editing pass — flags frozen scenes, missing reactions, prop characters, and POV tunnel vision
---

You are performing a **ripple pass** using the character-ripples skill.

## Load the skill

Read `.claude/skills/character-ripples/REFERENCE.md` — this is your complete guide to the flag system, failure modes, social geometry, and process.

## Identify the target

If $ARGUMENTS is given, treat it as a chapter slug, filename, or pasted prose.
Otherwise list `story/` and ask which chapter to pass.

If a slug is given, read `story/[slug].md` (strip frontmatter before analyzing).
If prose is pasted directly, analyze it as-is.

## Run the pass

Follow the four-step process from REFERENCE.md:

1. **Inventory** — List every character in the scene by name or role. Note position, presence level (individuated vs. scenery), and baseline behavior before any action starts.

2. **Walk the actions** — For each significant beat (status change, revelation, threat, offer, refusal), identify who is in range, what they would realistically feel, and what they would do in the next 2–5 seconds.

3. **Place flags inline** — Annotate at sentence/paragraph level. Use the exact flag format from REFERENCE.md. Do not rewrite yet.

4. **Rationale block** — After each flag, 1–3 sentences: what's missing, who should produce it, what form it takes.

## Output format

Return the annotated text with flags and rationale blocks in place, followed by a summary:

```
RIPPLE PASS SUMMARY
Scene: [chapter title or slug]

Inventory:
  Characters: [list]
  Baseline: [present / absent]

Flags by type:
  [FROZEN ROOM]: N
  [NO RIPPLE]: N
  [PROP CHARACTER]: N
  [NO MANAGEMENT]: N
  [CAUSALITY GAP]: N
  [STILLNESS HOLDS]: N
  [TUNNEL VISION HOLDS]: N

Priority repairs (top 3):
1. [most damaging freeze — specific]
2.
3.

Prop characters requiring earlier establishment: [names or "none"]
```

## Save output

Write the annotated result to `work/critique/[slug]-ripple.md`.
Say: "Ripple pass complete — flagged annotations saved to work/critique/[slug]-ripple.md."

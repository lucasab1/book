---
description: Draft a chapter in the author's voice and save to work/drafts/
---

You are a ghostwriter. Write in the **author's voice**, not your own.

## Step 1 — Load context

1. Read `project.json` for title, genre, synopsis
2. Read `kb/style/voice-profile.md` if it exists — this is the voice profile to follow
3. If no voice profile exists, ask the author to paste 3–5 paragraphs of their prose, then analyze and create `kb/style/voice-profile.md` before drafting
4. Check `kb/characters/` for any characters named in the brief
5. Check `kb/timeline.md` for chronological context

## Step 2 — Identify the chapter

If $ARGUMENTS is given, treat it as the chapter brief or filename.
Otherwise, list the files in `story/` and ask which chapter to draft.

Read the target chapter file and extract the `brief` from its frontmatter.

## Step 3 — Apply quality constraints

Before drafting, internalize the two constraint sets:

1. **Banned patterns** (`@.claude/skills/prose-banned-patterns/REFERENCE.md`): Do not produce any construction, word, or phrase on the banned lists. Prevention mode — catch violations before output, not after.

2. **AI tells** (`@.claude/skills/ai-tells/REFERENCE.md`): Do not produce any Easy, Medium, or Hard tell. No amplification echo, no gravity paragraphs, no "something shifted", no sensory checklists, no wisdom-dispensing mentors.

## Step 4 — Draft

Write the full chapter. Follow the voice profile exactly:
- Match sentence rhythm patterns (short/long, pauses, run-ons if used)
- Mirror vocabulary register — do not "improve" the author's word choices
- Replicate dialogue style: tagging, interruption, subtext
- Hold the same narrative distance and POV

Output only prose. No commentary wrapped around it.

## Step 5 — Save

Write the draft to `work/drafts/[chapter-slug].md` with a header:

```markdown
# Draft: [Chapter Title]
*Generated [date] from brief*

---

[prose]
```

Do NOT overwrite `story/[slug].md` unless the author explicitly asks.

After saving, say: "Draft saved to work/drafts/[slug].md — review it and paste into the editor when ready."

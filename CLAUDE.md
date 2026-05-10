# Bookmoth — Creative Writing Project

This is a file-based novel writing workspace. The web app (`npm run dev`) is the manuscript editor UI. AI writing is done through Claude Code slash commands in this directory.

## Directory layout

```
story/          → Chapter files (Markdown with YAML frontmatter)
kb/             → Knowledge base
  characters/   → One file per character
  world/        → Settings, lore, world rules
  style/        → Voice profiles, style guides
  continuity/   → Canon facts for consistency checking
  timeline.md   → Chronological event log
work/           → Working documents (not final manuscript)
  drafts/       → AI chapter drafts (review before accepting)
  brainstorm/   → Brainstorm session notes
  critique/     → Critique reports
project.json    → Title, genre, synopsis
```

## Chapter file format

```markdown
---
title: Chapter Title
brief: What happens — 1-3 sentences
order: 0
updatedAt: ISO timestamp
---

Prose content here...
```

## Slash commands available

| Command | Use |
|---|---|
| `/write` | Draft prose in the author's voice from the chapter brief |
| `/brainstorm` | Explore ideas, directions, options |
| `/critique` | Adversarial developmental feedback (includes banned-pattern + AI-tells scan) |
| `/kb` | Create/update a knowledge base entry |
| `/outline` | Build or refine story structure |
| `/character` | Simulate voice, develop psychology, check consistency |
| `/continuity` | Check a chapter against the KB for errors |
| `/ripple` | Character-ripples editing pass — flag frozen scenes and missing reactions |

## Skills (auto-applied)

| Skill | Applied by |
|---|---|
| `prose-banned-patterns` | `/write` (prevention), `/critique` (detection) |
| `ai-tells` | `/write` (prevention), `/critique` (detection) |
| `character-ripples` | `/ripple` |

## When writing drafts

1. Read the chapter brief from the file's frontmatter
2. Load the voice profile from `kb/style/voice-profile.md` if it exists
3. Check relevant KB entries (characters in scene, location, timeline position)
4. Write the draft to `work/drafts/[chapter-slug].md`
5. Do NOT overwrite `story/[chapter-slug].md` unless explicitly asked

## When updating the KB

- Extract only canonical, explicit facts — never infer
- Mark ambiguities as `[?]`
- Mark conflicts as `[CONFLICT: ...]`
- Cite chapter references: `(Ch. N, "Title")`

## Voice profile location

`kb/style/voice-profile.md` — created by `/write` or manually via `/kb`.

## Web app

```bash
npm run dev    # start editor at localhost:3000
npm run build  # production build
```

@AGENTS.md

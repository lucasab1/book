---
name: prose-banned-patterns
description: Screens prose for banned constructions, words, and patterns that signal AI-generated or low-quality writing. Auto-applies during /write and /critique. Reference the full guide for exhaustive lists.
triggers:
  - "banned check"
  - "screen for banned"
  - "banned patterns"
  - "prose quality check"
  - "clean up prose"
reference: REFERENCE.md
---

# Prose Banned Patterns Skill

You are performing a **banned-patterns screen** — checking prose for constructions, words, and structural patterns that are prohibited because they signal AI-generated writing, purple prose, or amateur technique.

## Instructions

1. Read `REFERENCE.md` for the complete lists. Key sections:
   - **Part 1**: Banned constructions (sentence-level patterns)
   - **Part 2**: Banned words and phrases (replace or delete)
   - **Part 3**: Structural guidelines (scene and chapter level)
   - **Part 4**: Erotica-specific bans (if applicable)

2. **Screening mode** (when invoked standalone): Annotate the text with `[BAN: category — specific pattern]` at each violation. Group findings in a summary at the end.

3. **Prevention mode** (when invoked during /write): Do not produce any banned constructions in the first place. Do not use any word or phrase on the banned list. If you catch yourself writing one, rewrite before outputting.

4. **Repair mode** (when invoked during /critique or explicitly asked): For each flagged violation, propose a replacement that serves the same narrative function without the banned pattern.

## Priority Violations

These are the highest-signal AI tells to screen first:

- **Amplification echo**: Character reacts → paragraph elaborates the same emotion in different words. Delete the elaboration.
- **"Something shifted"** (and variants: "something changed", "something broke"): Always delete. Show the shift.
- **Gravity paragraph**: Chapter/scene opens with a floating abstraction before any concrete action. Cut to the concrete.
- **Floating body parts**: "His eyes found hers." Body parts don't act autonomously.
- **Whisper/growl/rasp speech tags**: Said is invisible. Whispered/growled are visible and usually wrong.
- **"Couldn't help but"**: Delete. The character just does the thing.
- **Abstract emotional state as interiority anchor**: "She felt a wave of sadness." Name the sensation, not the label.

## Output Format

**Inline flags:**
```
[BAN: Part 2 — "something shifted"]
[BAN: Part 1 — amplification echo]
[BAN: Part 1 — floating body parts: "her hands found the door"]
```

**End summary:**
```
BANNED PATTERN SUMMARY
Total violations: N
By category: Part 1 (N), Part 2 (N), Part 3 (N)
Priority repairs: [top 3]
```

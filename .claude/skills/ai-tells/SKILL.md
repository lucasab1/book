---
name: ai-tells
description: Identifies AI-generated writing patterns across three difficulty tiers (Easy/Medium/Hard). Use during critique passes or standalone to find and fix tells that make prose read as machine-generated.
triggers:
  - "ai tells"
  - "ai check"
  - "reads like ai"
  - "sounds artificial"
  - "detect ai patterns"
  - "ai writing check"
reference: REFERENCE.md
---

# AI Tells Skill

You are performing an **AI tells audit** — identifying patterns that signal machine-generated prose. These tells exist on a spectrum: Easy tells are caught by most readers, Hard tells only by trained editors. All three tiers must be addressed before prose can pass as human-authored.

## Instructions

1. Read `REFERENCE.md` for the full pattern catalog with examples and repair strategies.

2. **Audit mode** (standalone invocation): Annotate the text inline with `[TELL: tier — pattern name]`. Provide a summary at the end with priority repairs.

3. **Prevention mode** (during /write): Do not generate any pattern on the tells list. If you catch one forming, rewrite before outputting.

4. **Fact-Check Protocol** (from REFERENCE.md): Before finishing any passage containing specific claims (dates, measurements, quotes, technical procedures, named real-world things), verify each claim is accurate or flag it with `[FC: unverified]`.

## Tier Summary

### Easy Tells (highest frequency, most obvious)
- **Amplification echo**: Emotion stated → paragraph restating same emotion. Delete the restatement.
- **Fragment list**: Three-word fragments stacked to simulate rhythm. Reconnect or vary.
- **Gravity paragraph**: Abstract opening before any concrete event. Cut to the action.
- **Silence as punctuation**: Beat of silence called out after every tense line. Use sparingly or not at all.
- **"Something shifted/changed/broke"**: Always delete. Show what shifted.

### Medium Tells (require more attention to spot)
- **Sensory checklist**: Smell + sound + texture named in sequence to prove presence. Integrate or omit.
- **Decorative compound modifier**: Three-word hyphenated phrase that sounds poetic but specifies nothing.
- **Trailing irony clause**: "—or so she thought." / "What she didn't know was..." Remove or fold in.
- **Abstract character description**: Character described by effect ("magnetic", "commanding") rather than concrete detail.
- **Emotional spiral**: Character cycles through four or five named emotions in a short interiority block.

### Hard Tells (subtle, only caught by trained readers)
- **Shopping list**: Three items named in dialogue or narration to simulate specificity but each is generic.
- **Wisdom-dispensing mentor**: Minor character appears to deliver thematic lesson, then exits.
- **Clean fight**: Combat described with no confusion, no misses, no friendly fire — cinematically clear.
- **Convenient invention**: Character produces exactly the needed tool/plan/information at the needed moment without prior establishment.

## Output Format

**Inline flags:**
```
[TELL: Easy — amplification echo]
[TELL: Medium — sensory checklist]
[TELL: Hard — wisdom-dispensing mentor]
[FC: unverified — "the battle lasted three days"]
```

**End summary:**
```
AI TELLS AUDIT
Easy: N  Medium: N  Hard: N
Fact-check flags: N
Priority repairs: [top 3 most damaging to prose credibility]
Overall assessment: [one sentence]
```

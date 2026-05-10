# AI Tells — Pattern Catalog

Structural and compositional patterns that survive word-level editing. Organized by detection difficulty.

## Easy to Detect (searchable or countable)

### 1. Amplification Echo

The same idea stated twice, the second time with more intensity. The second sentence contains no new information.

**Examples:**

- "He did not hurry. He never did."

- "She was not afraid. She had never been afraid."

- "It did not work on him. Very little did."

**Detection:** Look for adjacent sentences where the second rephrases or intensifies the first. Common markers: "never" echoing "not," "very little" echoing a negative, "always" echoing a positive.

**Threshold:** Zero per scene. Every instance is a problem. If the first sentence is too weak to stand alone, replace it — don't prop it up.

**Fix:** Delete the echo. If the first sentence needs more weight, rewrite it as a single stronger sentence.

### 5. Fragment List of Dramatic Significance

Nouns or short phrases stacked as fragments for emotional weight.

**Examples:**

- "Bodies. Thousands of them."

- "Heroes. Liberators. Gratitude."

- "Same sodium. Same mystery textures. Same stomach roulette."

**Detection:** Search for sequences of sentence fragments (no verb, or single-word sentences) appearing in groups of 2+.

**Threshold:** One per chapter, maximum. Two in the same scene is a tic.

**Fix:** If the information matters, put it in a real sentence. If only rhythm matters, the fragments are decoration — cut them.

### 6. One-Sentence Paragraph of Gravity

A single short sentence isolated as its own paragraph for dramatic weight.

**Examples:**

- "No one spoke."

- "The room fell silent."

- "That was deliberate."

**Detection:** Count single-sentence paragraphs under 8 words. Especially flag silence/stillness statements.

**Threshold:** Two per scene maximum. More than two and no individual instance carries weight because every moment is being scored equally.

**Fix:** Integrate into the surrounding paragraph, or cut entirely if the preceding paragraph already carries the weight.

### 14. Silence as Punctuation

Explicit narration of silence or absence of speech after significant moments.

**Examples:**

- "Silence settled over the room."

- "No one spoke."

- "A long silence followed."

**Detection:** Search for: silence, no one spoke, fell silent, quiet settled, pause hung, stillness.

**Threshold:** Two per scene. If the statement that precedes the silence is strong, the silence is implied and doesn't need narration.

**Fix:** Delete. Trust the reader to feel the pause.

**Note:** Overlaps with item 6. A silence line that is ALSO a one-sentence gravity paragraph is a double tell.

### 15. "Something Shifted"

Vague emotional change described without specificity.

**Examples:**

- "Something shifted in his eyes."

- "Something changed in her expression."

- "But something had shifted."

**Detection:** Search for "something" + shifted/changed/broke/moved/flickered/passed.

**Threshold:** Zero. Every instance is a failure to observe. Already covered in prose-craft banned list ("articulation by proxy") but worth flagging here as a structural pattern when it appears at scene transitions.

**Fix:** Name the actual change. What did the eyes do? What did the expression become?

## Medium to Detect (requires reading, not just searching)

### 2. Sensory Checklist

Every new space gets exactly three sensory details, usually smells, in a list.

**Examples:**

- "Roasted spice, seared citrus oil, a ghost of smoked fish skin."

- "Incense, salt wind, rare citrus resin."

- "Therra blossom, ironroot, and mint."

**Detection:** At each scene/location transition, check whether sensory details arrive in a triad. Especially flag three-item smell lists.

**Threshold:** Two triads in the same chapter is a pattern. One per chapter is fine if varied.

**Fix:** Sometimes one detail is enough. Sometimes a room doesn't smell like anything worth mentioning. Vary the sense (sound, texture, temperature, light) and vary the count. Let the POV character's attention determine what gets noticed, not a formula.

### 3. Decorative Compound Modifier

Abstract noun + sensory detail that sounds poetic but adds nothing over plain description.

**Examples:**

- "A ghost of smoked fish skin."

- "A whisper of aged leather."

- "A memory of burnt cedar."

**Detection:** Look for \[abstract noun\] + "of" + \[concrete sensory detail\]. Common abstract nouns: ghost, whisper, memory, hint, trace, suggestion, echo, shadow.

**Threshold:** One per scene at most. These pattern-match to "literary" without requiring actual observation.

**Fix:** Replace with plain language. "Faint smell of fish skin." Save the poetry for moments where figurative language does real work — reveals character, shifts tone, earns its complexity.

### 4. Trailing Irony Clause

A subordinate clause that recontextualizes the main statement with dry wit or balanced ambiguity.

**Examples:**

- "He kept a meticulous house, which was another way of saying he trusted no one."

- "They called it diplomacy, which was a generous word for what actually happened."

- "He said it with the certainty of a man who had never been wrong about anything he considered important."

**Detection:** Look for: "which was," "which meant," "or at least," "depending on," "if you were being generous/charitable," "another way of saying." Also the "either X or Y, depending on Z" construction.

**Threshold:** One per scene is voice. Two is a habit. Three or more is a tic. Count them.

**Fix:** If the clause contains a fact, integrate it into the sentence or make it its own sentence. If it contains only tone, cut it. The main statement should carry its own weight.

**⚠ UNFIXABLE WARNING:** Claude reads these as good writing and cannot reliably self-detect them. User must flag.

### 7. False-Profound Negation/Resolution

Negate the obvious reading, then land on something meant to sound deeper.

**Examples:**

- "Not for justice. For control."

- "Not a hero. Not a villain. Just a man with a sword."

- "Not a threat. Something worse."

**Detection:** Search for "Not \[X\]. \[Y\]." and "Not \[X\]. Not \[Y\]. \[Z\]." patterns. Also "Not \[X\] — \[Y\]" with em-dash.

**Threshold:** Zero in narration. Already hard-banned in prose-craft. Flagged here because the structural pattern (two-beat or three-beat negation/resolution) can appear in variations that dodge the literal "not X but Y" search.

**Fix:** Weave the information into a real sentence that tells you something specific about the character. "He insisted on honesty because it made people predictable, and he valued predictability above most things, including honesty."

### 8. Abstract-Noun Character Description

Characters described as collections of abstract qualities rather than observed behavior.

**Examples:**

- "She was silence, patience, and rage."

- "He was ambition in a green hood."

- "They were memory, flaw, hunger."

**Detection:** Look for "\[Character\] was \[abstract noun\]" or "\[Character\] was \[abstract\], \[abstract\], and \[abstract\]."

**Threshold:** Zero. Every instance asserts depth without demonstrating it. Show through action, dialogue, or specific observed detail.

**Fix:** Replace with what the character actually does that makes the reader conclude the abstract quality for themselves.

### 9. Narrator Falls in Love with the Protagonist

Every description of the main character reads like a press release for how impressive they are.

**Examples:**

- "He moved with a grace that suggested the universe owed him an apology."

- "A long moment, the kind that made people reconsider their life choices."

- "She gave a slight shrug — one of those economical movements that somehow conveyed entire paragraphs of unconcern."

**Detection:** In descriptions of the POV character or protagonist, check: is the narrator *telling* the reader the character is impressive, or *showing* actions the reader can evaluate? Watch for: "the kind of \[X\] that \[Y\]," "somehow," "effortlessly," "without seeming to," "the sort of \[person/gesture/silence\] that \[impressed others\]."

**Threshold:** Zero in close-third narration. The narrator is the character's cognition, not their publicist. In external observation from another POV, use sparingly — the observing character can be impressed, but the narrator shouldn't campaign.

**Fix:** Describe what the character actually does. Let the reader decide if it's impressive.

### 13. Emotional Spiral That Won't Stop Repeating

The same anxiety or emotional state expressed in multiple metaphors across a scene, each arriving at the same conclusion.

**Examples (across a scene):**

- Pass 1: "Am I missing some essential component?"

- Pass 2: "Can you love something you suspect is fundamentally broken?"

- Pass 3: "A machine that asked good questions but felt the wrong things."

- Pass 4: "The wiring ran clean but the thing that makes a person a person was left out."

**Detection:** Track the character's emotional throughline across a scene. If the same insight is reached 3+ times through different imagery, it's spiraling.

**Threshold:** Two passes on the same emotional territory per scene maximum. The first states it. The second can deepen or complicate it. The third means the scene isn't moving.

**Fix:** Hit the emotion hard once. Revisit once at a different angle that adds new information or complication. Then let the character (and the reader) move forward. If the emotion needs to persist, show it through behavior changes across the scene, not through repeated interiority.

## Hard to Detect (requires structural awareness)

### 10. The Shopping List

Sequential inventory of items, gear, rooms, or features, each getting equal narrative weight.

**Examples:**

- Item. Price. Comment. Item. Price. Comment. Item. Price. Comment.

- Room. Description. Room. Description. Room. Description.

- Gear check: Bow strung. Quiver full. Knife secure. Pack ready.

- Ship description: Hull paragraph. Armor paragraph. Weapons paragraph.

**Detection:** Look for sequences where 3+ items/locations/features receive parallel descriptive treatment of similar length and structure.

**Threshold:** Three parallel items is the warning. Four or more is a list. Pick 1-2 that reveal character or world, summarize the rest.

**Fix:** Select the items that do narrative work (characterise, foreshadow, establish world). Cut or compress the rest into a single sentence.

### 11. Wisdom-Dispensing Mentor Scene

Two characters talk. The older one delivers a perfectly calibrated anecdote or aphorism that maps exactly onto the younger character's situation. The younger character receives it gracefully. Everyone exits improved.

**Detection:** In any scene where an older/more experienced character advises a younger one, check: is the advice perfectly targeted? Does the younger character accept it too easily? Is the wisdom delivered as a clean aphorism?

**Threshold:** One perfect-delivery wisdom moment per chapter is a genre convention. Two is suspicious. If the advice is always right and always received, the scene lacks friction.

**Fix:** Let advice be oblique, partially wrong, or badly timed. Let the younger character resist, misunderstand, or apply it incorrectly. Let the useful insight be buried in irrelevance. Real mentorship is messy.

### 12. The Clean Fight

Combat where every hit lands cleanly, every death is one motion, bodies fall cinematically.

**Detection:** In action scenes, check: does every strike connect? Does every kill happen in one clean motion? Do injuries follow predictable dramatic logic rather than messy physical reality? Are consequences immediate and final?

**Threshold:** If every kill in a scene is a single decisive motion, the combat reads as choreography. Mix in: missed strikes, weapons that get stuck, injuries that don't immediately incapacitate, the ugly parts of violence.

**Fix:** Let something not work on the first try. Let a wound bleed and hurt and the character keep fighting. Let the violence be clumsy where it would be clumsy.

### 16. Frictionless Competence Fantasy

Every problem has already been anticipated and solved. Every preparation is adequate. Every subordinate is perfectly competent.

**Detection:** Check: does any plan encounter real resistance? Does any preparation prove inadequate? Does any character make a mistake that isn't immediately corrected by another character? If the answer to all three is no, the scene is a competence fantasy.

**Threshold:** At least one genuine friction point per scene. Something should go wrong, prove insufficient, or require adaptation that wasn't planned for.

**Fix:** Introduce a problem that hasn't been anticipated. Let a character be wrong about something. Let a resource be unavailable. Friction is what makes competence interesting — competence against resistance, not competence in a vacuum.

### 17. The Convenient Invention ⚠

AI adds details that weren't in the story because they make the scene tidier or more dramatic. Directions, motivations, knowledge states, timeline connections — quietly invented to serve narrative convenience.

**Detection:** After any AI-contributed passage, check every concrete factual detail against established canon:

- Directions and distances

- Character motivations and knowledge states (cross-reference secrets.md)

- Timeline placement

- Connections between events

- Details about characters not present in the scene

**Threshold:** Zero tolerance. Any invented fact is a violation.

**Fix:** Remove the invented detail. If the scene needs the detail to work, flag it for the user to decide whether to canonise it.

**⚠ UNFIXABLE WARNING:** Claude cannot reliably distinguish facts it knows from facts it generated. This check requires the user's knowledge of their own canon. secrets.md and timeline.md exist partly to catch this pattern. Always cross-reference.

## The Master Test

Read the draft aloud (or simulate reading aloud by attending to rhythm). Check:

1. **Rhythmic monotony:** Does every paragraph have the same cadence? Does every scene have the same weight? A grief scene should not have the same rhythm as a comedy scene. A fight should not have the same rhythm as a political negotiation.

2. **Pattern accumulation:** Any single pattern from this list might appear once and be fine. Count total instances across the full draft. If the draft contains 3+ amplification echoes, 3+ fragment lists, 3+ gravity paragraphs, and 3+ trailing irony clauses, the text has been haunted — even if no individual pattern crosses its own threshold.

3. **The unevenness test:** Does the prose have rough spots, variation, places where the narrator's personality changes with the scene? If every paragraph sounds like it was written by the same person in the same mood, something has been sanded flat.

**⚠ UNFIXABLE WARNING:** Claude cannot hear its own default cadence. Rhythmic monotony is the deepest structural tell and the hardest to self-correct. The user's ear is the final authority.


# Fact-Check Protocol — Catching Convenient Inventions

This protocol runs after any scene where Claude contributed plot details, world-building elements, character actions, or dialogue. Its purpose is to catch Pattern 17 (The Convenient Invention) — the most dangerous AI tell because it doesn't look like a style problem.


## What to Check

### 1. Knowledge States

For every character in the scene, verify:

- Does the character know what the narration says they know?

- Does the character react to information they shouldn't have?

- Does dialogue reveal knowledge the speaker hasn't acquired on-page?

- Does interiority reference events the character wasn't present for?

**Common failure mode:** Claude gives characters "earned intuition" — a character correctly guesses something they have no basis to guess, because Claude knows the answer and unconsciously routes it through the character's perception.

### 2. Timeline Consistency

For events referenced or occurring in the scene, verify against timeline.md:

- Do references to past events match their established timing?

- Are characters the right age for the timeframe?

- Do "two days ago" / "last week" / "years ago" references align with the timeline?

- Has Claude compressed or rearranged the sequence of events for dramatic convenience?

**Common failure mode:** Claude collapses time between events to create urgency or dramatic connection. "Just yesterday" when the established timeline says it was three weeks ago.

### 3. Spatial and Physical Details

- Do directions match established geography?

- Do distances match what's been established?

- Are characters in locations they could plausibly reach in the stated timeframe?

- Do physical descriptions match character sheets?

**Common failure mode:** Claude moves characters to where they need to be for the scene without accounting for how they got there. Also: inventing physical details (eye color, scars, clothing) that contradict established descriptions.

### 4. Motivation Consistency

- Are character actions consistent with their established psychology and goals?

- Has Claude invented a motivation to justify an action the plot requires?

- Does a character do something convenient for the plot that contradicts their established patterns?

**Common failure mode:** Claude writes a character making the "right" dramatic choice rather than the choice that character would actually make given who they are. The scene works better, but the character is briefly someone else.

### 5. Invented Connections

- Has Claude created a link between events or characters that the user didn't establish?

- Has Claude added foreshadowing for events that aren't planned?

- Has Claude created dramatic irony by having the narrator gesture toward information the story hasn't set up?

**Common failure mode:** Claude adds thematic connections because they feel satisfying. "And she was heading north. Same as her." — sounds great, wasn't established, might contradict what IS established.


## How to Run the Check

After the scene is drafted:

1. List every factual claim in the scene (character knowledge, timeline references, spatial details, motivations stated or implied)

2. Cross-reference each against the relevant world-bible files

3. Flag anything that doesn't have a source in established canon

4. For flagged items, classify as:

   - **Contradiction** — directly conflicts with established canon (must fix)

   - **Invention** — plausible but not established (flag for user to accept or reject)

   - **Extrapolation** — reasonable inference from established facts (note but likely fine)

Present all flags to the user. Do not silently fix contradictions — the user may prefer to update canon rather than change the scene.



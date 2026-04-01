---
name: ielts-reading-review
description: "IELTS Reading passage review and error analysis skill. This skill should be used when the user finishes an IELTS Academic Reading passage and wants a structured review, including per-question error analysis, synonym tracking, vocabulary building, and pattern-based mistake tracking. Generates professional HTML review notes with optional PDF export. Trigger phrases include: 雅思复盘, 帮我复盘阅读, IELTS reading review, 分析错题, 阅读错题分析."
---

# IELTS Reading Review Skill

## Purpose

Transform raw IELTS Academic Reading practice results into structured, actionable review notes. Each review produces a professional HTML document covering error analysis, synonym accumulation, vocabulary building, and recurring-mistake tracking — helping users systematically improve their reading score.

## When to Activate

- User sends IELTS reading passage content with answers / score / error information
- User asks to review or analyze IELTS reading errors
- User mentions "复盘", "错题分析", "阅读复盘", "reading review"

## Workflow

### Step 1: Collect Input

Ensure the following information is available (ask if missing):

- **Source**: Which Cambridge book, test, and passage (e.g., Cambridge 5 Test 1 Passage 2)
- **Original text** or enough context to locate answers
- **Answer key / correct answers**
- **User's answers** and which ones are wrong
- **Optional**: Translation, time spent, user's self-reflection

### Step 2: Analyze Every Wrong Answer

For each wrong question, produce a structured analysis block:

1. **Locate the source sentence** — Quote the exact sentence(s) from the passage
2. **Map key words** — Show `question keyword` → `passage synonym/paraphrase`
3. **Classify the error cause** — Use the error taxonomy in `references/error-taxonomy.md`
4. **Extract the lesson** — One actionable takeaway

For correct answers on difficult questions, briefly note the synonym mapping to reinforce learning.

### Step 3: Build the Review Note (HTML)

Use the HTML template at `assets/review-template.html` as the structural and styling foundation.

File naming convention: `剑X-TestX-PassageX-TopicKeyword复盘.html`

The note must include these sections in order:

1. **📌 Score summary & alert box** — Overall score, per-type breakdown, one-sentence core problem
2. **❌ Per-question error breakdown** — Detailed analysis for each wrong answer
3. **🔄 Synonym accumulation table** — Passage expression → Question expression → Chinese meaning → Question number
4. **📝 Vocabulary table** — Word, definition, IELTS frequency rating, Cambridge appearance history
5. **💡 Recurring mistake tracker** — Cross-passage pattern tracking

#### Vocabulary Frequency Rating

Reference `references/538-keywords-guide.md` to rate each word:

| Rating | Criteria |
|--------|----------|
| ⭐⭐⭐ | Category 1: Top 54 keywords (90% question rate) |
| ⭐⭐ | Category 2: 171 keywords (60% question rate) |
| ⭐ | Category 3: 300+ keywords |
| — | Not in 538 list; check COCA 5000 for general frequency |

The "Cambridge Appearance" column should track which real tests the word has appeared in — this accumulates over time.

### Step 4: Generate PDF (Optional)

If the user wants a PDF:

1. Prefer using the script at `scripts/generate-pdf.js` with `puppeteer-core` + local Chrome
2. Key parameters: A4 format, 2cm margins, `displayHeaderFooter: false`
3. If dependencies are not installed, run `npm install puppeteer-core` first, or suggest the user print from browser as an alternative

### Step 5: Update Long-term Memory

After each review, update the working memory:

- Add any **new recurring error patterns** discovered
- Update the **vocabulary appearance tracking** across passages
- Note the user's progress on previously identified weaknesses

## Error Analysis Rules (Critical)

These rules are battle-tested and must be strictly followed:

### TRUE / FALSE / NOT GIVEN

Use the **Three-Step Method**:

1. **Find the topic** — Does the passage discuss the topic/object mentioned in the question? → If NO → **NOT GIVEN**
2. **Find the stance** — If the topic exists, does the passage agree or contradict? → **TRUE** / **FALSE**
3. **Verify** — "If I choose TRUE/FALSE, can I point to the exact sentence?" If not → likely **NOT GIVEN**

**Key distinctions:**
- "Not mentioned" = NOT GIVEN (not FALSE)
- FALSE requires **direct contradicting evidence** in the passage
- A general statement (e.g., "most other parts of the world") that covers the question's subject counts as "discussed" — not NOT GIVEN
- Every keyword in the question must match the passage; if even one doesn't align → lean toward NOT GIVEN

### Fill-in-the-blank

- **Never repeat words already in the question stem** — After filling in the answer, re-read the complete sentence to check for duplicates
- Respect word limits strictly

### Multiple Choice / Multi-select

- **Every keyword** in a chosen option must find correspondence in the passage
- "Roughly related" ≠ "correct answer"
- The most common trap: first half of an option matches, but the second half adds information not in the passage

### Common Pitfall: Over-inference

- Only consider what the author **explicitly wrote** — do not infer conclusions
- Concessive clauses like "However far from reality..." acknowledge unreality, not confirm truth
- `however + adj/adv` = `no matter how` (concessive), not causal

## Reference Files

| File | Purpose |
|------|---------|
| `references/error-taxonomy.md` | Complete error type classification with examples |
| `references/538-keywords-guide.md` | Guide for using the 538 IELTS keywords list |
| `references/review-style-guide.md` | Writing style and formatting conventions |
| `assets/review-template.html` | HTML template with full CSS styling |
| `scripts/generate-pdf.js` | PDF generation script (Node.js + puppeteer-core) |

## Style Guidelines

- **Concise and direct** — No fluff, no decorative titles, focus on actionable content
- **Function-oriented** — Every sentence should help the user improve
- Vocabulary notes should include phonetic transcription
- Error analysis should be blunt about the mistake cause — sugar-coating doesn't help learning
- Chinese is the primary language for notes, with English terms preserved as-is

### Example 1

**Statement:**  
All students prefer online learning over classroom learning.

**Passage:**  
Many students enjoy the flexibility of online learning, but others still value face-to-face interaction in classrooms.

**Answer:**  
False

**Explanation:**  
The passage says "many" not "all". So the statement is exaggerated.

**Trap Type:**  
Absolute words (all vs many)

### Example 2

**Statement:**  
The research was conducted in 2020.

**Passage:**  
The study was published in 2020, but data collection began in 2018.

**Answer:**  
Not Given

**Explanation:**  
The passage does not clearly state when the research was conducted.

**Trap Type:**  
Not Given vs False confusion
### Example 3

**Statement:**  
Some employees work remotely.

**Passage:**  
All employees are required to work from the office.

**Answer:**  
False

**Explanation:**  
The statement says "some", but passage clearly says "all must work in office".

**Trap Type:**  
Scope mismatch (some vs all)
### Example 4

**Statement:**  
The train arrives before 8 PM.

**Passage:**  
The train usually arrives after 8 PM due to delays.

**Answer:**  
False

**Explanation:**  
Timing is reversed (before vs after).

**Trap Type:**  
Time/sequence trap
### Example 5

**Statement:**  
The company always meets its deadlines.

**Passage:**  
The company often meets deadlines, but delays are sometimes unavoidable.

**Answer:**  
False

**Explanation:**  
"Often" ≠ "always".

**Trap Type:**  
Absolute words

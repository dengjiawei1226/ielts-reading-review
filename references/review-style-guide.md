# Review Note Style Guide

## General Tone

- **Concise and direct** — No decorative language, no marketing-speak
- **Function-oriented** — Every sentence exists to help the user improve
- **Honest about errors** — Sugar-coating doesn't help learning; be blunt about what went wrong
- **Chinese as primary language** — English terms, vocabulary, and passage quotes preserved as-is

## Section-by-Section Guidelines

### Score Summary & Alert Box
- State the score factually: `得分：8/13 ｜ 用时：18:30`
- Break down by question type with ✅ / ❌ indicators
- The alert box should contain ONE sentence identifying the biggest scoring pattern (not a vague "需要加强练习")
- Bad example: "阅读理解能力有待提升" ← too vague
- Good example: "3道判断题全错，均为 NG 误判为 FALSE——没区分「没提到」和「相反」" ← specific and actionable

### Error Analysis Blocks
- Always include the **original passage quote** in a blockquote
- Keyword mapping uses `code` formatting: `题目词` = 原文同义词
- Error cause should reference the error taxonomy category
- Each block ends with a single-sentence lesson

### Synonym Table
- Only include synonyms relevant to the questions (not every synonym in the passage)
- Include the question number for cross-reference
- Chinese meaning should be concise (2-4 characters)

### Vocabulary Table
- Include phonetic transcription (IPA) after the word
- Part of speech before the definition
- IELTS frequency rating is mandatory (see 538 keywords guide)
- "Cambridge Appearance" column starts with current passage and accumulates over time
- Skip low-frequency specialist terms unless they caused an error

### Recurring Mistake Tracker
- Only include if the same error pattern has appeared in previous passages
- Format: List each occurrence with passage reference
- This section should grow across reviews — it's the most valuable long-term asset
- **Include a per-question-type progress trend table** when data from 3+ passages exists (see below)

### Per-question-type Progress Trend (NEW)

When the user has completed 3+ passages of the same question type (e.g., T/F/NG), include a mini trend table:

```html
<div class="good-box">
<strong>📈 T/F/NG Passage 3 进步趋势：</strong>
<table>
<thead><tr><th>篇章</th><th>T/F/NG 正确率</th></tr></thead>
<tbody>
<tr><td>剑5T2P3</td><td>0/3（0%）</td></tr>
<tr><td>剑5T3P3</td><td>1/6（17%）</td></tr>
<tr><td><strong>剑5T4P3</strong></td><td><strong>4/7（57%）↑↑</strong></td></tr>
</tbody>
</table>
</div>
```

Rules:
- Use the `.good-box` CSS class (green border) for positive trends
- Bold the current passage row
- Add ↑/↑↑/↓ indicators for trend direction
- After the table, provide 2-3 sentences of specific analysis (not generic encouragement)

### Fill-in-the-blank Readback Checklist (NEW)

Every review that includes fill-in-the-blank errors MUST include this checklist as an `.alert-box`:

```html
<div class="alert-box">
<strong>📋 填空题回填检查清单（每道必做）：</strong>
<ol>
<li><strong>语法检查</strong>：放回去读一遍——主谓一致？冠词搭配？</li>
<li><strong>词性检查</strong>：空格前后的结构决定了需要名词/动词/形容词/副词</li>
<li><strong>语义检查</strong>：答案和题目的主题必须匹配（题目说 plants → 答案不能是 animals）</li>
<li><strong>字数检查</strong>：不超过题目要求的字数限制</li>
</ol>
</div>
```

This checklist must appear after the fill-in-the-blank error analysis section, not buried at the end.

### Correct Answer Brief Analysis (NEW)

For correct answers on non-trivial questions (especially T/F/NG), include a brief confirmation note showing the synonym mapping:

```html
<h3>✅ Q27：题目原文... <span class="tag-yes">TRUE</span></h3>
<p>原文："引用..."<br/>
<code>题目关键词</code> = <code>原文同义替换</code>。✅</p>
```

Purpose: Reinforce the synonym recognition that led to the correct answer. Keep it to 2-3 lines — don't over-explain correct answers.

### Progress Highlight Box (NEW)

At the top of each review (right after the score summary), include a `.good-box` highlighting what went RIGHT:

```html
<div class="good-box">
<strong>✅ 进步点：</strong><br/>
① 具体进步描述...<br/>
② 具体进步描述...
</div>
```

Rules:
- Always find at least 1 positive point, even in a bad score
- Be specific: "T/F/NG 前 4 道全对" is good; "有进步" is bad
- Place it before the alert-box (problems)

### Test Scorecard (Full Test)
- Generated when the user completes all 3 passages of a test
- Format: `得分 + 用时 + 总计/40 + 总用时 + 雅思分数`
- Per-passage scores shown as separate P1/P2/P3 columns
- Time breakdown: `P1时间+P2时间+P3时间=总时间` (e.g., `34:10+35:32+51:13=120:55`)
- Band score from `references/score-band-table.md`, boundary scores shown as range (e.g., `6.5-7.0`)
- Always include comparison to the 60-minute exam time limit

### Cumulative Progress Table
- Generated when 2+ full tests exist in memory
- Rows ordered chronologically (oldest first → newest last)
- Columns: 场景 | P1 | P2 | P3 | 总计/40 | 总用时 | 雅思分数
- After the table, include 3-5 sentences of progress analysis:
  1. Accuracy trend (is score improving?)
  2. Speed vs. 60-minute benchmark
  3. ONE concrete strategy suggestion
  4. Per-passage pattern observation (P3 usually hardest)
- Tone: encouraging but honest. Examples:
  - Good: "正确率在上升（5.0→6.5-7.0），好消息"
  - Good: "速度还需要提上来——如果硬卡 60 分钟，正确率可能会掉 1-1.5 分"
  - Good: "不过现阶段先追正确率再追速度是对的"
  - Bad: "继续加油哦！" ← empty encouragement

## Naming Convention

`剑X-TestX-PassageX-TopicKeyword复盘.html`

Examples:
- `剑4-Test3-Passage1-街头青年信贷复盘.html`
- `剑5-Test2-Passage3-动物迁徙复盘.html`

## Formatting Rules

- Use the HTML template's CSS classes: `.correct`, `.wrong`, `.tag-yes`, `.tag-no`, `.tag-ng`, `.alert-box`
- Tables must use the template's styling (blue header, alternating row colors)
- Keep page-break-inside: avoid on blockquotes and table rows for clean PDF output
- No emoji overuse — limit to section headers (📌 ❌ 🔄 📝 💡)

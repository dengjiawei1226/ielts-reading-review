---
name: ielts-reading-review
description: "IELTS Reading passage review, scoring, and progress tracking skill. Generates structured review data (JSON) and professional HTML/PDF review notes locally — no server required. Supports batch import of legacy reviews with auto-discovery of review folders. Trigger phrases: 雅思复盘, 帮我复盘阅读, IELTS reading review, 分析错题, 阅读错题分析, 成绩单, 打分, 统计, 进步趋势, 批量导入历史复盘, 历史笔记转 JSON, 把文件夹里的复盘都生成 JSON, 扫一下我电脑里的复盘, 帮我找出所有历史笔记, 自动发现复盘, score, band, progress, batch import, auto scan."
---

# IELTS Reading Review Skill

## Purpose

帮用户把雅思阅读做题结果变成结构化复盘笔记（HTML + PDF）和结构化数据（JSON），追踪分数进步趋势。

## Architecture (v3.9.1 — Offline + Template Page + Web Hand-off)

**Skill 纯离线执行**——所有错题分析、文件生成都在本地完成，不发起任何网络请求。

产出物：
1. **复盘 HTML** — 专业排版的复盘笔记，双击浏览器打开（独立静态文件）
2. **结构化 JSON（v4.0）** — 成绩、错题、词汇、同义替换的全量数据。**部署到 `reviews/` 后可通过 `review.html?file=xxx.json` 在线渲染**（新通用模板页）
3. **复盘 PDF** — 从 HTML 生成的 PDF 文件，便于存档和分享（可选）

> **v3.9.1 新增**：Step 0 自动版本检查（scripts/check-update.js），每次激活时比对本地与 ClawHub 版本。

> **v3.9.0 新增**：词库覆盖校验（dict_full.json 缺词 = 词卡展开不工作）、saveReview API 入库步骤、answers[] 字段名规范、线上词卡验证步骤。

> **v3.8 新增**：Web 端新增 `review.html` 通用模板页，可直接渲染 JSON（支持 v3.0 和 v4.0）。后端 `buildReviewFileIndex` 优先索引 `.json` 文件，reviewLink 自动指向 `review.html?file=xxx.json`。

产出物与 Web 端（tuyaya.online）的对接方式详见下方 **Step 6: Apply to Web**。

## When to Activate

- 用户发做题截图/答案，提到"复盘""错题分析""阅读复盘"
- 用户问成绩、分数、进步趋势
- 用户要生成复盘笔记或 PDF

## Step 0: Version Check (Auto — Run on Every Activation)

**每次 Skill 被激活时，先检查版本是否最新**：

```bash
node ~/.workbuddy/skills/ielts-reading-review/scripts/check-update.js
```

- 如果输出 `✅ 已是最新版本` → 继续正常工作
- 如果输出 `🆕 有新版本可用！` → **提示用户**：

```
⚠️ ielts-reading-review 有新版本 vX.Y.Z（当前 vA.B.C），是否更新？
更新内容可能包含新的错误分类规则、部署步骤修复等。
```

用户同意后执行自动更新：
```bash
node ~/.workbuddy/skills/ielts-reading-review/scripts/check-update.js --auto
```

> 如果 `check-update.js` 不存在（旧版本安装），跳过版本检查继续工作。

## Workflow

### Step 1: Collect Input

确保以下信息齐全（缺什么问什么）：

- **来源**：哪本书、哪套题、哪篇（如剑5 Test1 Passage2）
- **原文**或答题上下文
- **正确答案**
- **用户答案**及错题
- **🔴 用时（MUST ASK）**：做题用时（格式 `MM:SS`，如 `28:01`）。**必问项**，不能标"可选"——Web 端进步趋势图依赖此字段。用户若没计时，明确询问"这套大概做了多久"让其估算，别直接跳过
- **可选**：翻译、自我反思

### Step 1b: Screenshot Wrong Answer Protocol (CRITICAL)

**用户发答题截图时必须执行 3 步**：

1. **逐题读截图标记**：每题是红色（错）还是绿色（对），不能跳题，不能用自己的判断代替截图标记
2. **先报错题清单等确认**：输出"根据截图，错题为 QX/QY/QZ（共N道），请确认"，**确认后才能写分析**
3. **截图标记是唯一真相**：截图 vs 自己判断冲突时，信截图

**禁止**：跳过确认直接写分析、用 answer comparison 覆盖截图标记。

### Step 2: Generate Review HTML

基于 `assets/review-template.html` 模板，使用 `references/` 下的规范生成完整复盘 HTML 文件。

**🔴 文件命名强制规范（MUST FOLLOW）**：

文件名格式：`剑{book}-Test{test}-Passage{passage}-{titleCN}复盘.html`

- `{titleCN}` **必须与 JSON 里的 `source.titleCN` 字段完全一致**（同一个字符串，一字不差）
- **必须以"复盘"两字结尾**（不是"积累"、不是直接 `.html`）
- **禁止**：空格、下划线、英文连字符中混中文
- 示例：
  - ✅ `剑5-Test1-Passage2-鲸鱼感官复盘.html`
  - ✅ `剑6-Test4-Passage2-识字女性与育儿复盘.html`
  - ❌ `剑4-Test3-Passage2-火山专题积累.html`（缺"复盘"两字）
  - ❌ `剑6-Test4-Passage2-识字女性育儿复盘.html`（和 title 里"与"字不一致）

**命名一致性自检（生成前必做）**：
1. 决定 `titleCN` 后，HTML 文件名、JSON 文件名、JSON 内 `source.titleCN` 三者必须用**完全相同**的中文串
2. 生成完成后，自查输出"`{文件名}` 和 `source.titleCN='{titleCN}'` 一致 ✅"
3. 如果篇目已在 `site/answer-key.json` 里存在，直接复用其 `title` 字段作为 `titleCN`，**不要自创新表述**（避免和已有文件/数据库漂移）

遵循 `references/review-style-guide.md` 的设计规范（V2 紫色渐变主题、Lucide 图标、卡片布局）。

### Step 3: Generate Review Data JSON (v4.0)

在生成 HTML 的同时，输出一份结构化 JSON 文件，供后续导入 Web 系统。**Web 端 `review.html` 通用模板页可直接渲染此 JSON。**

**输出文件命名规则**：`剑X-TestX-PassageX-中文主题复盘.json`

> 命名必须与 Step 2 的 HTML 文件名**主干完全一致**（只差后缀），否则会触发 Web 端路径错乱。

示例：
- HTML: `剑5-Test1-Passage2-鲸鱼感官复盘.html`
- JSON: `剑5-Test1-Passage2-鲸鱼感官复盘.json`
- `source.titleCN`: `"鲸鱼感官"`

> **命名说明**：文件名使用中文标题（`source.titleCN`），方便用户在文件管理器中一眼识别内容。Web 端导入时通过 JSON 内的 `source.book/test/passage` 识别篇目，不依赖文件名。

**🔴 timing 字段必须填充**：
- `minutes`：数值型分钟（支持小数，如 `28.0` / `35.4`）
- `formatted`：`"MM:SS"` 字符串（如 `"28:01"`）
- MM:SS → minutes 换算：`分钟 + 秒/60`，保留 1 位小数
- 用户实在给不出用时，才能置 `null`，但必须在回复里提醒"缺用时，进步图将缺一个点"

```json
{
  "version": "4.0.0",
  "generatedAt": "2026-04-28T10:00:00.000Z",
  "source": {
    "book": 7,
    "test": 1,
    "passage": 3,
    "title": "English Title",
    "titleCN": "中文标题"
  },
  "score": {
    "correct": 9,
    "total": 14,
    "band": "6.0",
    "breakdown": {
      "fillBlank": { "correct": 4, "total": 6 },
      "tfng": { "correct": 3, "total": 4 },
      "matching": { "correct": 2, "total": 4 }
    }
  },
  "timing": {
    "minutes": 25,
    "formatted": "25:00"
  },
  "date": "2026-04-28",
  "progressNote": "简短进步总评（如'比上次提升2分'）",
  "alertNote": "核心告警信息（如'Summary填空全军覆没'，可选）",
  "answers": [
    { "q": 1, "my": "TRUE", "correct": "TRUE", "result": "correct" },
    { "q": 2, "my": "FALSE", "correct": "NOT GIVEN", "result": "wrong" }
  ],
  "wrongQuestions": [
    {
      "q": 3,
      "type": "tfng",
      "badge": "TFNG",
      "myAnswer": "TRUE",
      "correctAnswer": "NOT GIVEN",
      "errorCategory": "ng-false-confusion",
      "analysis": "错因分析文字",
      "lesson": "教训一句话",
      "quote": "原文引用（英文）",
      "quoteRef": "Para B, Line 3",
      "analysisPoints": ["分析要点1", "分析要点2"]
    }
  ],
  "actionItems": [
    "下次做 TFNG 前必须标注否定词",
    "Summary 填空必须三步走"
  ],
  "synonyms": [
    {
      "original": "原文表达",
      "replacement": "题目表达",
      "meaning": "中文释义",
      "questionRef": "Q3"
    }
  ],
  "vocabulary": [
    {
      "word": "exemplify",
      "phonetic": "/ɪɡˈzemplɪfaɪ/",
      "pos": "v.",
      "definition": "举例说明",
      "ieltsFreq": 3,
      "source": "538 #42",
      "appearance": "剑7T1P3"
    }
  ],
  "problems": [
    {
      "type": "同义替换识别失败",
      "detail": "具体表现",
      "questions": "Q3, Q7",
      "improvement": "改进方法"
    }
  ]
}
```

**v4.0 相对 v3.0 新增字段**（均可选，v3.0 JSON 仍能被模板页渲染）：
- `progressNote`：进步总评
- `alertNote`：告警信息
- `answers[]`：全部答案对照表（含 result: correct/wrong/skipped）
- `actionItems[]`：行动清单
- `wrongQuestions[].badge`：题型简写标签（如 "TFNG"、"Fill"、"Match"）
- `wrongQuestions[].quote` / `quoteRef`：原文引用 + 定位
- `wrongQuestions[].analysisPoints[]`：分析要点列表

**🔴 answers[] 字段名规范（MUST FOLLOW）**：

`answers` 数组中每条记录的字段名**必须**严格使用以下格式：
```json
{ "q": 1, "my": "TRUE", "correct": "TRUE", "result": "correct" }
```
- `my`：用户答案（不是 `myAnswer`）
- `correct`：正确答案字符串（不是布尔值）
- `result`：`"correct"` / `"wrong"` / `"skipped"`（字符串，不是布尔值）

> **注意**：`wrongQuestions[]` 里用的是 `myAnswer` / `correctAnswer`（全拼），和 `answers[]` 的缩写不同。这是历史设计，review.html 模板已做兼容处理，两种格式都能正确渲染。

### Step 3b: Generate Bilingual Data (MANDATORY — JSON only, no HTML)

**每次复盘必须同时完成一件事**，无需用户提醒：

#### 追加双语数据到 bilingual_data.json

> **⚠️ v3.8 变更**：不再生成独立的双语 HTML 文件。Web 端已全面动态化，`bilingual.html?book=X&test=Y&passage=Z` 直接从 `bilingual_data.json` 加载渲染。旧的 `site/bilingual/*.html` 已清理。

在 `site/bilingual_data.json` 中追加一条结构化数据：

```json
{
  "book": 7, "test": 1, "passage": 1,
  "title_cn": "中文标题",
  "title_en": "English Title",
  "subtitle": "剑X · Test Y · Passage Z · 双语逐段对照",
  "source_info": "Cambridge IELTS X, Test Y, Reading Passage Z",
  "review_link": "../reviews/剑X-TestY-PassageZ-{titleCN}复盘.html",
  "paragraphs": [
    { "label": "Paragraph A", "en": "English text with <span class=\"vocab-highlight\" title=\"释义\">highlighted</span> words", "cn": "中文翻译" }
  ],
  "vocab_words": [
    { "word": "example", "meaning": "释义", "example": "Example sentence." }
  ]
}
```

**规则**：
- 词汇高亮：用正则替换英文段落中首次出现的词汇为 `<span class="vocab-highlight" title="释义">word</span>`
- 追加后按 `(book, test, passage)` 排序
- **⚠️ Python 脚本中中文引号会被当作字符串终止符**——中文 `""` 必须用 `\u201c\u201d` 转义

#### ~~3b-2: 双语 HTML 文件~~（已废弃）

> **v3.8 起不再需要**。旧 `bilingual/*.html` 已清理，Web 端通过 `bilingual.html` 模板页动态加载 `bilingual_data.json` 渲染。

### Step 4: Generate PDF (Optional)

如果用户需要 PDF：

```bash
node scripts/generate-pdf.js 剑X-TestX-PassageX-主题复盘.html
```

需要 puppeteer-core + 本地 Chrome。PDF 输出到同目录。

### Step 5: Update Memory

复盘完成后更新 working memory：新增的错误模式、词汇、成绩数据。

### Step 6: Apply to Web (User-Initiated)

复盘生成完成后，**输出以下引导**：

---

📤 **复盘文件已生成！**

| 文件 | 用途 |
|------|------|
| `剑X-TestX-PassageX-主题复盘.html` | 双击打开即可阅读，可打印 |
| `剑X-TestX-PassageX-主题复盘.json` | 导入到 Web 端同步成绩。部署后可在线通过 `review.html?file=xxx.json` 查看 |

**一键同步到 Web 端** 👉 [点此上传 JSON](https://tuyaya.online/ielts/submit.html?mode=json)

上传页面会自动从 JSON 中识别出篇目信息（如「剑5 Test1 Passage2 · 鲸鱼感官」），确认后点击「导入」即可。

> 💡 JSON 文件在你当前的工作目录中，文件名如 `剑5-Test1-Passage2-鲸鱼感官复盘.json`

---

#### 其他同步方式

**方式 B：Skill 伴侣脚本**（私有部署场景）

如果有 `ielts-server-sync` skill（个人专用），可命令行批量上传：

```bash
# 单文件上传
node ~/.workbuddy/skills/ielts-server-sync/scripts/upload.js 剑5-T1-P2.json

# 批量上传目录
node ~/.workbuddy/skills/ielts-server-sync/scripts/upload.js --batch ./reviews/
```

**方式 C：纯离线**

直接双击 `.html` 文件即可阅读 / 打印，不依赖任何服务器。

**重要**：Skill 本身 **不执行任何网络请求**。所有上传操作由用户主动发起，数据隐私可控。

### Step 7: Deploy Checklist (MANDATORY — DO NOT SKIP)

**🔴 每次复盘完成后，必须逐项执行以下检查清单。不能靠记忆，必须逐条过。**

这是 2026-04-27 踩了6个坑后总结的教训——文件遗漏、部署遗漏、数据遗漏。

#### 7a. 本地文件归位

- [ ] 复盘 HTML 已复制到 `site/reviews/`（不是根目录！）
- [ ] 复盘 JSON 已复制到 `site/reviews/`
- [ ] `answer-key.json` 已更新（新增本篇条目）
- [ ] `bilingual_data.json` 已新增本篇双语数据（英中逐段对照 + 词汇列表）
- [ ] `generate_vocab_synonym.py` 已运行，更新 dict_full.json + synonym_data.json
- [ ] **🔴 词库覆盖校验（MUST — 否则词卡展开不工作）**：运行以下检查，确保本篇所有 vocabulary 词汇都在 `dict_full.json` 中有完整条目（含 meaning_cn + examples）

```python
# 词库覆盖校验（复盘生成后必跑）
import json
with open('site/dict_full.json') as f:
    dmap = {w['word'].lower(): w for w in json.load(f) if 'word' in w}
with open('site/reviews/剑X-TestX-PassageX-主题复盘.json') as f:
    vocab = json.load(f).get('vocabulary', [])
missing = [v['word'] for v in vocab if v['word'].lower() not in dmap]
if missing:
    print(f'❌ dict_full.json 缺失 {len(missing)} 词：{missing}')
    print('→ 必须补充这些词（含 meaning_cn/examples/synonyms）后再部署')
else:
    print('✅ 词库覆盖完整')
```

如果有缺失词：**立即补充到 dict_full.json**（每词需含 meaning_cn、phonetic、root、examples、synonyms、antonyms），补完重新部署。
**绝不能跳过此步**——缺词 = 线上词卡点击无响应 = 用户体验崩坏。

#### 7b. SCP 部署到线上

所有以下文件必须通过 Cloudflare Tunnel SCP 部署到 `/var/www/ielts/`：

```
site/reviews/剑X-TestX-PassageX-主题复盘.html    → /var/www/ielts/reviews/
site/reviews/剑X-TestX-PassageX-主题复盘.json    → /var/www/ielts/reviews/
site/answer-key.json                             → /var/www/ielts/
site/bilingual_data.json                         → /var/www/ielts/
site/dict_full.json                              → /var/www/ielts/
site/synonym_data.json                           → /var/www/ielts/
```

#### 7c. saveReview API 入库（MANDATORY）

复盘数据必须写入后端数据库，否则首页进度图看不到这篇：

```bash
ssh openclaw-tunnel 'python3 -c "
import json, urllib.request
payload = json.dumps({
    \"action\": \"saveReview\",
    \"token\": \"<USER_TOKEN>\",
    \"book\": X, \"test\": Y, \"passage\": Z,
    \"score\": <correct>, \"total\": <total>, \"duration\": <minutes>,
    \"date\": \"YYYY-MM-DD\",
    \"answers\": {}
})
req = urllib.request.Request(\"http://localhost:3100/api/ielts\", data=payload.encode(), headers={\"Content-Type\": \"application/json\"})
resp = urllib.request.urlopen(req)
print(resp.read().decode())
"'
```

> API 路径是 `POST /api/ielts`，通过 `action` 字段分发（不是 `/api/ielts/saveReview`）。

#### 7d. 后端重启

```bash
ssh openclaw-tunnel "sudo systemctl restart ielts-api"
```

**必须重启**——后端启动时 `buildReviewFileIndex()` 扫描 `reviews/` 目录建索引。不重启 = 新文件不出现在首页。

#### 7e. 线上验证

- [ ] `getReadingPageData` API 返回新篇目数据（`POST /api/ielts` + `action: getReadingPageData`）
- [ ] `bilingual.html?book=X&test=Y&passage=Z` 能正常显示双语内容
- [ ] 复盘链接可正常访问：
  - 有 JSON 的篇目：`review.html?file=剑X-TestX-PassageX-主题复盘.json`（新模板页）
  - 仅有 HTML 的旧篇目：`reviews/剑X-TestX-PassageX-主题复盘.html`（旧静态页）
- [ ] **🔴 词卡展开验证**：打开复盘页面，点击词汇表中至少 1 个词，确认能弹出详情卡（含释义/例句/近义词）。如果点击无反应 → dict_full.json 缺词，回 7a 补词

#### 7f. HTML 模板检查

新生成的复盘 HTML 必须满足：
- hero-nav 使用 `/ielts/reading.html`（绝对路径，不是 `../reading.html`）
- 按钮文字为"目录"（不是"首页"）
- icon 为 `list`（不是 `home`）

**曾犯的典型遗漏**（引以为戒）：
1. 文件生成在根目录没 cp 到 site/reviews/
2. bilingual_data.json 本地更新了忘了 SCP
3. 只做了 P1 双语没做同套题的 P2/P3 双语
4. 没重启后端导致 review 索引没刷新
5. hero-nav 按钮用了旧模板（相对路径 + "首页"）
6. JSON 文件没 SCP 到 reviews/
7. **dict_full.json 缺词导致词卡展开不工作**——复盘新增词汇不在词库中，必须做词库覆盖校验
8. **没调 saveReview API 导致首页进度图缺数据**——文件部署 ≠ 数据入库，两者都要做
9. **answers[] 用了错误字段名**——必须用 `my`/`correct`(字符串)/`result`(字符串)，不能用布尔值

## Batch Import Mode (v3.8 — Legacy Review Folder → JSON)

**触发场景**：用户说"帮我把 XX 目录下的历史复盘都转成 JSON"、"批量导入我以前的复盘笔记"、"扫一下我电脑里的复盘"、"帮我找出所有历史笔记"等。

此模式下 Buddy 自主循环，**无需用户自己找路径、无需一篇篇喂**。

### Step B0: Auto-Discovery（🔍 推荐默认起点）

**不要开口就问用户"复盘文件夹在哪？"**——先自动扫常见位置：

```bash
node ~/.workbuddy/skills/ielts-reading-review/scripts/scan-legacy-reviews.js --auto
```

脚本会扫描以下位置并按命中数推荐：
- 当前工作目录 (cwd)
- `~/Documents`、`~/Documents/个人`、`~/Documents/个人/WorkBuddy`
- `~/Desktop`、`~/Downloads`
- `~/Library/Mobile Documents/com~apple~CloudDocs`（iCloud）
- `~/WorkBuddy`、`~/WorkBuddy/Claw`

输出 `discoveries`（去重后的真实命中目录，命中数多的子目录优先）和 `recommended`（首选目录）。

**把发现结果呈现给用户**：

```
我扫了你电脑常见位置，找到你的复盘应该在这里：

🎯 推荐：/Users/xxx/Documents/个人/WorkBuddy/雅思学习（60 个候选文件）
   样例：剑6-Test3-Passage3-抗衰老药物复盘.html / 剑4-Test1-听力Part2-河滨工业村复盘.html …

其他候选：
  - /Users/xxx/Downloads（4 个）

要用推荐目录还是选其他的？
```

用户点头后进入 Step B1 做精扫。**只有当自动发现完全找不到候选（discoveries 为空）时**，才问用户要具体路径。

### Step B1: Scan the Folder

调用扫描脚本生成候选清单：

```bash
# 默认只扫顶层
node ~/.workbuddy/skills/ielts-reading-review/scripts/scan-legacy-reviews.js <目录> --out=/tmp/ielts-scan.json

# 需要递归子目录
node ~/.workbuddy/skills/ielts-reading-review/scripts/scan-legacy-reviews.js <目录> --deep --out=/tmp/ielts-scan.json
```

输出 JSON 结构（groups 按篇目聚合）：

```json
{
  "totalFiles": 18,
  "identifiedPassages": 6,
  "groups": [
    {
      "passage": "C5-T1-P2",
      "fileCount": 3,
      "files": [
        { "path": "...", "ext": ".html", "hints": { "book": 5, "test": 1, "passage": 2, "title": "鲸鱼感官" } },
        { "path": "...", "ext": ".md" },
        { "path": "...", "ext": ".png" }
      ]
    },
    { "passage": "__unknown__", "files": [...] }
  ]
}
```

### Step B2: Show Plan & Confirm

读取 scan 结果后，**必须先给用户一份执行计划**，不要直接开干：

```
扫描完成，找到 18 个候选文件，识别出 6 篇复盘：

✅ 可识别：
  1. 剑5-T1-P2 · 鲸鱼感官（HTML + MD + 截图，共 3 个文件）
  2. 剑5-T1-P3 · 儿童认知（HTML）
  3. 剑6-T2-P1 · ...
  ...

⚠️ 无法识别篇目（需你人工分配）：
  - notes-2026-03-15.md
  - 错题整理.docx

我将逐篇处理可识别的 6 篇，每篇生成一个 JSON。预计 10-15 分钟。
确认开始？
```

用户点头后才进入 Step B3。

### Step B3: Loop — Generate JSON for Each Passage

**逐篇循环**，每次处理一组：

1. 读取该组所有文件内容（HTML 提纯文字、MD 直读、图片用视觉 OCR）
2. 从内容中提取：原文/正确答案/用户答案/错题/时长/日期
3. **关键兜底**：
   - 内容里找不到"正确答案" → 查 `site/answer-key.json`（本地答案库，401 题全覆盖）
   - 找不到用户答案 → 标注 `score.correct = null` 让用户后续补
   - 错题列表不清晰 → 只生成基础成绩单 JSON，`wrongQuestions: []`
4. 按 v4.0 schema 生成 JSON（v3.0 新增字段可选），文件名 `剑X-TestX-PassageX-中文主题复盘.json`
5. 写入用户指定的输出目录（默认 `./batch-output/`）
6. 输出一行进度：`✅ [3/6] 剑5-T1-P3 · 儿童认知 → 剑5-Test1-Passage3-儿童认知复盘.json`

### Step B4: Summary Report

全部完成后输出总结：

```
批量导入完成！

✅ 成功：5 篇（已生成 5 个 JSON 到 ./batch-output/）
⚠️ 部分数据缺失：1 篇（剑6-T2-P1 找不到用户答案，score.correct 置空）
❌ 跳过：0 篇

下一步：
👉 打开 https://tuyaya.online/ielts/submit.html?mode=json
👉 把 ./batch-output/ 里所有 JSON 拖进去，一键导入
```

### Batch Mode Rules (MUST FOLLOW)

1. **永远先 scan + confirm，绝不跳过计划确认**
2. **每篇独立处理，失败不阻塞下一篇**（捕获异常，记录到 skip 列表）
3. **绝不编造数据**：用户答案缺失就置 null 或空数组，不要瞎填
4. **同义替换/词汇/错因分析是可选项**：老笔记里没有就不生成，不要硬凑
5. **答案库优先**：正确答案一律从 `site/answer-key.json` 核对，笔记里的可能是老婆写错的
6. **产物隔离**：批量输出统一放 `./batch-output/`，不污染用户工作目录

## Error Analysis Rules

### TRUE / FALSE / NOT GIVEN 三步法

1. **找话题** — 文章有没有讨论题目中的对象？→ 没讨论 = **NOT GIVEN**
2. **找立场** — 讨论了的话，是同意还是矛盾？→ **TRUE** / **FALSE**
3. **验证** — "如果选 TRUE/FALSE，能指出原文哪句话吗？" 指不出来 → 大概率 **NOT GIVEN**

关键区分：
- FALSE 需要**直接矛盾证据**，"没提到"= NG 不是 FALSE
- 概括性表达覆盖题目对象 = 算讨论过，不是 NG
- `however + adj` = `no matter how`（让步），不是因果

### Fill-in-the-blank

- 答案不能重复题干已有的词
- 填完必须通读：语法/词性/语义/字数 四项检查
- `such as ___` → 必须填具体例子
- `the ___ of X` → 必须填能和 "of X" 搭配的名词

### Common Pitfalls

- **过度推理**：只看作者明确写了什么，不推导
- **被绝对词吓到**：all/never 不一定错，看原文证据
- **人名观点混淆**：先在文中标注每个人说了什么
- **邻近干扰词**：从定位句提取答案，不要被旁边的句子污染
- **Heading 复用 Example**：做 Heading 题第一步永远是划掉 Example 已用的选项
- **Although 从句看错重点**：主句才是作者立场，让步从句只是背景
- **双重否定读反了**：not unusual=usual, not uncommon=common, rarely+isn't=几乎总是。看到双重否定立刻翻译成肯定
- **Summary 填空凭感觉**：必须先回原文找对应句，再从选项中匹配。不回原文 = 全靠蒙
- **对比信号词忽略**："difference from X" 本身就是对比框架，后面的内容就是证据
- **选择题选了和全文论点相反的**：选完后反问"这个选项和作者核心主张一致吗？"
- **段落匹配被信息密度干扰**：题目问 "term"（定义），选了有数字的段落而非有 "refer to as" 的段落。精确锁定每个关键词含义
- **Summary 填空近义词混用**：同段落两个近义表达，看题目限定词（如 Britain）对应原文哪个子语境
- **Summary 填空专有名称不完整**：看到引号/大写开头名称，先数字数，限制内写全称不缩写

## Error Categories

参见 `references/error-taxonomy.md`，共 18 类错误分类。JSON 中 `errorCategory` 字段使用以下 ID：

| ID | 错误类型 |
|----|---------|
| `synonym-failure` | 同义替换识别失败 |
| `ng-false-confusion` | NOT GIVEN / FALSE 混淆 |
| `over-inference` | 过度推理 |
| `stem-repetition` | 填空重复题干词 |
| `grammar-mismatch` | 语法/让步句理解错 |
| `incomplete-option` | 选项不完全匹配 |
| `vocab-gap` | 词汇缺口 |
| `carelessness` | 粗心/时间压力 |
| `word-form-error` | 填空词形/词性错 |
| `scope-confusion` | 跨代/范围混淆 |
| `category-reasoning` | 类别推理误判 |
| `adjacent-distractor` | 邻近干扰词 |
| `heading-example-reuse` | Heading匹配复用Example已用选项 |
| `concessive-clause-confusion` | Although/While让步从句混淆主句 |
| `double-negative-misread` | 双重否定读不出肯定 |
| `summary-no-source` | Summary填空没回原文定位 |
| `comparison-signal-ignored` | 对比信号词(difference from等)忽略 |
| `selection-contradicts-thesis` | 选择题选了和全文论点矛盾的选项 |

## Style Guidelines

- 简洁直接，不废话
- 错题分析直说问题，不糖衣炮弹
- 中文为主，英语术语保留原文

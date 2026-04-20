---
name: ielts-reading-review
description: "IELTS Reading passage review, scoring, and progress tracking skill. Generates structured review data (JSON) and professional HTML/PDF review notes locally — no server required. Trigger phrases: 雅思复盘, 帮我复盘阅读, IELTS reading review, 分析错题, 阅读错题分析, 成绩单, 打分, 统计, 进步趋势, score, band, progress."
---

# IELTS Reading Review Skill

## Purpose

帮用户把雅思阅读做题结果变成结构化复盘笔记（HTML + PDF）和结构化数据（JSON），追踪分数进步趋势。

## Architecture (v3.1 — Offline + Web Hand-off)

**Skill 纯离线执行**——所有错题分析、文件生成都在本地完成，不发起任何网络请求。

产出物：
1. **复盘 HTML** — 专业排版的复盘笔记，双击浏览器打开
2. **复盘 PDF** — 从 HTML 生成的 PDF 文件，便于存档和分享
3. **结构化 JSON** — 成绩、错题、词汇、同义替换的全量数据（v3.0 schema）

产出物与 Web 端（tuyaya.online）的对接方式详见下方 **Step 6: Apply to Web**。

## When to Activate

- 用户发做题截图/答案，提到"复盘""错题分析""阅读复盘"
- 用户问成绩、分数、进步趋势
- 用户要生成复盘笔记或 PDF

## Workflow

### Step 1: Collect Input

确保以下信息齐全（缺什么问什么）：

- **来源**：哪本书、哪套题、哪篇（如剑5 Test1 Passage2）
- **原文**或答题上下文
- **正确答案**
- **用户答案**及错题
- **可选**：翻译、计时、自我反思

### Step 1b: Screenshot Wrong Answer Protocol (CRITICAL)

**用户发答题截图时必须执行 3 步**：

1. **逐题读截图标记**：每题是红色（错）还是绿色（对），不能跳题，不能用自己的判断代替截图标记
2. **先报错题清单等确认**：输出"根据截图，错题为 QX/QY/QZ（共N道），请确认"，**确认后才能写分析**
3. **截图标记是唯一真相**：截图 vs 自己判断冲突时，信截图

**禁止**：跳过确认直接写分析、用 answer comparison 覆盖截图标记。

### Step 2: Generate Review HTML

基于 `assets/review-template.html` 模板，使用 `references/` 下的规范生成完整复盘 HTML 文件。

**输出文件**：`剑X-TestX-PassageX-主题复盘.html`

遵循 `references/review-style-guide.md` 的设计规范（V2 紫色渐变主题、Lucide 图标、卡片布局）。

### Step 3: Generate Review Data JSON

在生成 HTML 的同时，输出一份结构化 JSON 文件，供后续导入 Web 系统：

**输出文件**：`剑X-TestX-PassageX-主题复盘.json`

```json
{
  "version": "3.0.0",
  "generatedAt": "2026-04-20T23:00:00.000Z",
  "source": {
    "book": 5,
    "test": 1,
    "passage": 2,
    "title": "English Title",
    "titleCN": "中文标题"
  },
  "score": {
    "correct": 9,
    "total": 13,
    "band": "5.0",
    "breakdown": {
      "fillBlank": { "correct": 4, "total": 6 },
      "tfng": { "correct": 3, "total": 4 },
      "matching": { "correct": 2, "total": 3 }
    }
  },
  "timing": {
    "minutes": 25,
    "formatted": "25:00"
  },
  "date": "2026-04-20",
  "wrongQuestions": [
    {
      "q": 3,
      "type": "tfng",
      "myAnswer": "TRUE",
      "correctAnswer": "NOT GIVEN",
      "errorCategory": "ng-false-confusion",
      "analysis": "错因分析文字",
      "lesson": "教训一句话"
    }
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
      "appearance": "剑4T3P1"
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

### Step 4: Generate PDF (Optional)

如果用户需要 PDF：

```bash
node scripts/generate-pdf.js 剑X-TestX-PassageX-主题复盘.html
```

需要 puppeteer-core + 本地 Chrome。PDF 输出到同目录。

### Step 5: Update Memory

复盘完成后更新 working memory：新增的错误模式、词汇、成绩数据。

### Step 6: Apply to Web (User-Initiated)

复盘生成完成后，**提示用户**三种方式将产出物应用到 Web 端（https://tuyaya.online/ielts/）：

#### 方式 A：Web 端上传 JSON（推荐，零技术门槛）

1. 访问 https://tuyaya.online/ielts/submit.html
2. 登录账号（未登录会自动跳转）
3. 切换到顶部 Tab「**上传 JSON**」
4. 把生成的 `剑X-TestX-PassageX-xxx复盘.json` 拖入上传区
5. 点「导入到我的记录」—— 成绩、答案、用时会同步到服务器

导入后数据在以下页面自动生效：
- 首页成绩矩阵 / 最近记录
- 词汇本 / 同义替换本（自动合并新词和新映射）
- 个人中心 / 排行榜

#### 方式 B：Skill 伴侣脚本（私有部署场景）

如果有 `ielts-server-sync` skill（个人专用），可命令行批量上传：

```bash
# 单文件上传
node ~/.workbuddy/skills/ielts-server-sync/scripts/upload.js 剑5-T1-P2.json

# 批量上传目录
node ~/.workbuddy/skills/ielts-server-sync/scripts/upload.js --batch ./reviews/
```

#### 方式 C：浏览器打开 HTML 存档

直接双击生成的 `.html` 文件，浏览器打开即可阅读 / 打印，不依赖任何服务器。

**重要**：Skill 本身 **不执行任何网络请求**。所有上传操作由用户主动发起，数据隐私可控。

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

## Error Categories

参见 `references/error-taxonomy.md`，共 12 类错误分类。JSON 中 `errorCategory` 字段使用以下 ID：

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

## Style Guidelines

- 简洁直接，不废话
- 错题分析直说问题，不糖衣炮弹
- 中文为主，英语术语保留原文

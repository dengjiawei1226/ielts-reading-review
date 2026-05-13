---
name: ielts-reading-review
description: "IELTS Reading passage review, scoring, and progress tracking skill. Generates structured JSON review data with per-question error analysis (18 categories), synonym tracking, vocabulary building, score-to-band conversion, and progress trends. Supports batch import of legacy reviews. Trigger phrases: 雅思复盘, 帮我复盘阅读, IELTS reading review, 分析错题, 阅读错题分析, 成绩单, 打分, 统计, 进步趋势, 批量导入历史复盘, score, band, progress, batch import."
---

# IELTS Reading Review Skill

## Purpose

帮用户把雅思阅读做题结果变成结构化复盘数据（JSON），包含逐题错因分析、同义替换积累、词汇标注、错误模式追踪和进步趋势——系统性提升阅读分数。

## When to Activate

- 用户发做题截图/答案，提到"复盘""错题分析""阅读复盘"
- 用户问成绩、分数、进步趋势
- 用户要生成复盘笔记
- 用户要批量导入历史复盘

## Step 0: Version Check (Auto)

每次 Skill 激活时先检查版本：

```bash
node ~/.workbuddy/skills/ielts-reading-review/scripts/check-update.js
```

如果输出包含 `🆕 有新版本可用` → 提示用户更新。用户拒绝则在回复开头标注旧版本告警。

> 如果 `check-update.js` 不存在（旧版本安装），跳过版本检查。

## Workflow

### Step 1: Collect Input

确保以下信息齐全（缺什么问什么）：

- **来源**：哪本书、哪套题、哪篇（如剑5 Test1 Passage2）
- **原文**或答题上下文
- **正确答案**
- **用户答案**及错题
- **🔴 用时（MUST ASK）**：做题用时（格式 `MM:SS`）。必问项——进步趋势图依赖此字段。用户若没计时，让其估算
- **可选**：翻译、自我反思

### Step 1b: Screenshot Wrong Answer Protocol

用户发答题截图时执行 3 步：

1. **逐题读截图标记**：识别每题的对/错状态（参考下方多平台标记规则），不能跳题
2. **先报错题清单等确认**：输出"根据截图，错题为 QX/QY/QZ（共N道），请确认"
3. **截图标记是唯一真相**：截图 vs 自己判断冲突时，信截图

**禁止**：跳过确认直接写分析、用 answer comparison 覆盖截图标记。

#### 多平台截图标记识别规则

| 平台/场景 | 正确标记 | 错误标记 | 额外特征 |
|-----------|---------|---------|---------|
| 官方答题卡手批 | 绿色/✓ | 红色/✗ | 手写批注 |
| 雅思哥 (IELTSBro) | 绿色圆圈/✓ | 红色圆圈/✗ | 底部有得分统计 |
| 小站雅思 | 蓝色/✓ | 橙色/✗ | 卡片式布局 |
| 新东方雅思 | 绿色背景 | 红色背景 | 答案对比表格 |
| 其他 App（通用） | ✓/✔/☑/✅/绿色 | ✗/✘/☒/❌/红色 | — |

**识别策略**：
1. 先找得分统计（如 "8/13"）
2. 再找逐题标记
3. 提取用户答案
4. 模糊情况标注"不确定"并询问用户

### Step 2: Generate Review Data JSON (v4.0)

直接生成结构化 JSON 文件。**不生成 HTML**——后端模板统一渲染。

**输出文件命名**：`剑X-TestX-PassageX-中文主题复盘.json`

**🔴 timing 字段必须填充**：
- `minutes`：数值型分钟（如 `28.0`）
- `formatted`：`"MM:SS"` 字符串
- 用户实在给不出用时才置 `null`，但须提醒"缺用时，进步图将缺一个点"

```json
{
  "version": "4.0.0",
  "generatedAt": "2026-04-28T10:00:00.000Z",
  "source": {
    "book": 7, "test": 1, "passage": 3,
    "title": "English Title", "titleCN": "中文标题"
  },
  "score": {
    "correct": 9, "total": 14, "band": "6.0",
    "breakdown": {
      "fillBlank": { "correct": 4, "total": 6 },
      "tfng": { "correct": 3, "total": 4 },
      "matching": { "correct": 2, "total": 4 }
    }
  },
  "timing": { "minutes": 25, "formatted": "25:00" },
  "date": "2026-04-28",
  "progressNote": "简短进步总评",
  "alertNote": "核心告警信息（可选）",
  "answers": [
    { "q": 1, "my": "TRUE", "correct": "TRUE", "result": "correct" },
    { "q": 2, "my": "FALSE", "correct": "NOT GIVEN", "result": "wrong" }
  ],
  "wrongQuestions": [
    {
      "q": 3, "type": "tfng", "badge": "TFNG",
      "myAnswer": "TRUE", "correctAnswer": "NOT GIVEN",
      "errorCategory": "ng-false-confusion",
      "analysis": "错因分析",
      "lesson": "教训一句话",
      "quote": "原文引用", "quoteRef": "Para B, Line 3",
      "analysisPoints": ["分析要点1", "分析要点2"]
    }
  ],
  "actionItems": ["行动项1", "行动项2"],
  "synonyms": [
    { "original": "原文表达", "replacement": "题目表达", "meaning": "中文释义", "questionRef": "Q3" }
  ],
  "vocabulary": [
    { "word": "exemplify", "phonetic": "/ɪɡˈzemplɪfaɪ/", "pos": "v.", "definition": "举例说明", "ieltsFreq": 3, "source": "538 #42", "appearance": "剑7T1P3" }
  ],
  "problems": [
    { "type": "同义替换识别失败", "detail": "具体表现", "questions": "Q3, Q7", "improvement": "改进方法" }
  ]
}
```

**🔴 answers[] 字段名规范**：
- `my`：用户答案（不是 `myAnswer`）
- `correct`：正确答案字符串（不是布尔值）
- `result`：`"correct"` / `"wrong"` / `"skipped"`

> `wrongQuestions[]` 用全拼 `myAnswer`/`correctAnswer`，和 `answers[]` 缩写不同（历史设计）。

### Step 3: Cloud Sync (User-Initiated, Optional)

复盘完成后提示用户查看结果：

```
📊 复盘完成！查看结果：
- 在线首页：https://tuyaya.online/ielts/reading.html
```

如果用户想同步到云端，可使用环境变量配置后运行同步脚本：

```bash
# 需要先设置环境变量
export IELTS_API_KEY="your-api-key-here"

# 运行同步
bash scripts/sync-review.sh <path-to-data.json>
```

**Important**: 同步是用户主动选择的功能。User ID 基于机器指纹自动生成（匿名）。

### Step 4: Update Memory

复盘完成后更新 working memory：新增的错误模式、词汇、成绩数据。

## Batch Import Mode

**触发**：用户说"帮我把历史复盘都转成 JSON"、"批量导入"等。

### Step B0: Auto-Discovery

先自动扫描常见位置：

```bash
node ~/.workbuddy/skills/ielts-reading-review/scripts/scan-legacy-reviews.js --auto
```

把发现结果呈现给用户，确认后进入精扫。

### Step B1: Scan & Plan

```bash
node ~/.workbuddy/skills/ielts-reading-review/scripts/scan-legacy-reviews.js <目录> --out=/tmp/ielts-scan.json
```

**必须先展示执行计划给用户确认**，不要直接开干。

### Step B2: Loop — Generate JSON

逐篇处理，每篇独立，失败不阻塞下一篇：
1. 读取文件内容
2. 提取得分信息
3. 按 v4.0 schema 生成 JSON
4. 输出进度

### Batch Mode Rules

1. 永远先 scan + confirm，不跳过确认
2. 每篇独立处理，失败不阻塞
3. 不编造数据，缺失的置 null
4. 答案从 `references/` 目录核对

## Error Analysis Rules

### TRUE / FALSE / NOT GIVEN 三步法

1. **找话题** — 文章有没有讨论题目中的对象？→ 没有 = **NOT GIVEN**
2. **找立场** — 讨论了的话，同意还是矛盾？→ **TRUE** / **FALSE**
3. **验证** — "能指出原文哪句话吗？" 指不出来 → 大概率 **NOT GIVEN**

关键区分：
- FALSE 需要直接矛盾证据，"没提到" = NG
- 概括性表达覆盖题目对象 = 算讨论过，不是 NG
- `however + adj` = `no matter how`（让步），不是因果

### Fill-in-the-blank

- 答案不能重复题干已有的词
- 填完必须通读：语法/词性/语义/字数 四项检查
- `such as ___` → 必须填具体例子
- `the ___ of X` → 必须填能和 "of X" 搭配的名词

### Common Pitfalls

- **过度推理**：只看作者明确写了什么
- **被绝对词吓到**：all/never 不一定错，看原文
- **人名观点混淆**：先标注每人说了什么
- **邻近干扰词**：从定位句提取答案
- **Heading 复用 Example**：先划掉已用选项
- **Although 从句看错重点**：主句才是立场
- **双重否定读反了**：not unusual = usual
- **Summary 填空凭感觉**：必须回原文找对应句
- **对比信号词忽略**："difference from" = 对比框架
- **选择题选了和论点矛盾的**：选完反问"和核心主张一致吗？"

## Error Categories

共 18 类错误分类，JSON 中 `errorCategory` 使用以下 ID：

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
| `concessive-clause-confusion` | Although让步从句混淆主句 |
| `double-negative-misread` | 双重否定读不出肯定 |
| `summary-no-source` | Summary填空没回原文定位 |
| `comparison-signal-ignored` | 对比信号词忽略 |
| `selection-contradicts-thesis` | 选择题选了和论点矛盾的选项 |

## Reference Files

| File | Purpose |
|------|---------|
| `references/error-taxonomy.md` | 完整错误分类体系 |
| `references/538-keywords-guide.md` | 考点词评级指南 |
| `references/review-style-guide.md` | V2 设计系统 CSS 参考 |
| `references/score-band-table.md` | 分数→Band 换算表 |
| `scripts/check-update.js` | 版本检查脚本 |
| `scripts/scan-legacy-reviews.js` | 批量导入扫描脚本 |
| `scripts/generate-pdf.js` | PDF 生成（可选） |

## Style Guidelines

- 简洁直接，不废话
- 错题分析直说问题，不糖衣炮弹
- 中文为主，英语术语保留原文

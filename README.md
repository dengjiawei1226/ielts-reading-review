# IELTS Reading Review 雅思阅读复盘助手

> Finish a reading passage, hand it to AI, get a complete review — error analysis, synonym tracking, vocabulary tagging, and mistake pattern detection, all in one go.

做完阅读题，丢给 AI，自动出复盘笔记——错题拆解、同义替换积累、考点词标注、易错模式追踪，一步到位。

---

## 🆕 What's New in v2.3

### 📊 在线复盘系统（Web / 小程序）

除了 AI Skill，我们还上线了两个**在线复盘系统**，不用装任何东西，打开浏览器就能用：

🌐 **Web 版在线体验：** https://tuyaya.online/ielts/

> 做完题 → 输入答案 → 一键生成 AI 复盘报告，手机/电脑都能用。

<p align="center">
  <img src="assets/demo-web-reviews.png" width="700" alt="Web 版在线复盘系统 — 历史复盘记录列表">
</p>

📱 **微信小程序版**（开发中）：拍照识别答题卡 / 粘贴成绩 / 手动选题，三种方式快速录入。

### 📋 填空回填 4 步检查（v2.0+）

每道填空题强制 4 步验证：语法 → 词性 → 语义 → 字数，杜绝低级失误。

### ✅ 正确题确认 + 进步表扬（v2.0+）

- 做对的题也会简要确认，展示同义替换映射帮你强化记忆
- 每篇开头先肯定你的进步点，保持刷题动力

### 📈 题型进步趋势可视化（v2.0+）

按题型统计正确率变化，3+ 篇数据后展示进步曲线。

### 🔢 错误分类扩展到 12 类（v2.0+）

新增 4 类错因：
- 填空词性/词形错误（temperate → temperatures）
- 跨代/范围混淆（life cycle = 单棵植物一生）
- 类别归属当推理（A 类有 B 特征 → X 属于 A → X 有 B = 直接信息非推理）
- 近距离干扰词（classification vs 附近的 habitat）

### 📊 分数换算 + 跨篇进步追踪（v1.2+）

- 自动把原始分换算成雅思 Band 分（基于官方换算表）
- 每套题自动记分，P1/P2/P3 分段用时，对比 60 分钟考试限时
- 多套考试成绩汇总表 + 正确率/速度趋势分析

---

## 🚀 快速开始（3 步上手）

### 第一步：安装 Skill

```bash
# ClawHub 安装（推荐）
clawhub install ielts-reading-review

# 或手动复制到 skills 目录
cp -r ielts-reading-review ~/.workbuddy/skills/
```

### 第二步：做完一篇阅读题

用剑桥雅思真题（Cambridge IELTS）做完一篇阅读，准备好：
- ✅ 原文（拍照/截图/粘贴文字都行）
- ✅ 正确答案
- ✅ 你的答案（标出哪些做错了）
- ⭕ 可选：翻译、用时

### 第三步：发给 AI，说"帮我复盘"

就这么简单。AI 会自动生成一份完整的复盘笔记。

**🌐 不想装 Skill？直接用在线版：** https://tuyaya.online/ielts/

---

## 📖 完整使用案例

> 以下是一个真实的使用过程，以剑4 Test 3 Passage 1 为例。

### 你发给 AI 的内容

```
我做完了剑4 Test3 Passage1，帮我复盘。

文章：Micro-Enterprise Credit for Street Youth
用时：34:40
得分：7/13

我的答案 vs 正确答案：
Q1: 我选D → 正确A
Q2: 我选C → 正确D
Q3: ✅
Q4: ✅
Q5: 我填 Sudan and India → 正确 Sudan
Q6: ✅
Q7: 我填 shoe shine → 正确 Shoe Shine Collective
Q8-Q10: ✅
Q11: 我选 NOT GIVEN → 正确 NO
Q12: ✅
Q13: 我选D → 正确A

（然后把原文和翻译也贴上来）
```

### AI 自动产出的复盘笔记

AI 会生成一份结构化的 HTML 复盘笔记，包含以下模块：

#### 📌 模块一：得分总览 + Band 分换算 + 核心问题一句话

```
得分：7/13 ≈ Band 5.0 ｜ 用时：34:40
填空题 4/6 ❌ ｜ 判断题 1/2 ❌ ｜ 选择题 2/5 ❌

⚠️ 核心问题：同义替换识别能力弱——"in association with" = "as part of"、
"exemplify" = "用实例展示" 两组关键替换全部没识别出来，直接丢了 3 题。
```

> 注意：核心问题会精确指出最大的失分模式，不会说"阅读理解有待提升"这种废话。

#### 👍 模块二：进步点肯定

每篇开头先看你做对了什么、哪里比上次进步了。

#### ❌ 模块三：逐题错因分析

每道错题会拆解成 4 个部分：

**示例 — Q1（选择题）：**

| 项目 | 内容 |
|------|------|
| **题目** | The quotations at the beginning of the article... |
| **你选** | D. highlight the benefits **to society** of S.K.I. |
| **正确** | A. **exemplify** the effects of S.K.I. |
| **原文定位** | 引言中 Doreen 说"能给家人买早餐了"，Fan 说"学会了储蓄再投资" |
| **关键词映射** | `exemplify`（举例说明）= 用 Doreen 和 Fan 的个人经历展示 S.K.I. 的效果 |
| **错因分类** | 🏷️ 过度推理 — 引言只说了对个人和家庭的好处，你推断成了"对社会的好处" |
| **教训** | 选项多一个词（"to society"）就可能是陷阱，严格看原文范围 |

**示例 — Q11（判断题 T/F/NG）：**

| 项目 | 内容 |
|------|------|
| **题目** | Only one fixed loan should be given to each child. |
| **你选** | NOT GIVEN |
| **正确** | NO |
| **原文定位** | "Small loans are provided **initially**... the enterprises can be **gradually expanded** and consideration can be given to **increasing loan amounts**." |
| **关键词映射** | `only one` ↔ `initially...increasing`（最初→逐步增加 = 不止一次） |
| **错因分类** | 🏷️ NOT GIVEN/FALSE 混淆 — "initially" 暗示后续还有，"increasing" 直接矛盾 |
| **教训** | 题目出现 only/all/never 等绝对词时，大概率答案是 NO，重点找反驳证据 |

#### ✅ 模块四：正确题确认

做对的题也会简要确认，展示同义替换映射帮你强化记忆。

#### 🔄 模块五：同义替换积累表

| 原文表达 | 题目表达 | 中文释义 | 题号 |
|---------|---------|---------|------|
| in association with other types of support | as part of a wider program of aid | 配合其他支持 → 更广泛援助的一部分 | Q13 |
| support the economic lives | give business training and loans | 支持经济生活 → 提供商业培训和贷款 | Q2 |
| choose entrepreneurship | set up their own business | 选择创业 → 自己开业 | Q2 |

> **关键**：这张表会跨篇积累。做 10 篇之后你会发现同义替换的敏感度明显提升。

#### 📚 模块六：考点词表

| 词汇 | 频率 | 含义 | 来源 |
|------|------|------|------|
| exemplify | ⭐⭐⭐ 高频 | 举例说明 | 538 考点词 |
| initiative | ⭐⭐⭐ 高频 | 倡议、方案 | 538 考点词 |
| substantial | ⭐⭐ 中频 | 大量的、实质性的 | COCA 5000 |

> 只标注值得背的词。低频词自动过滤，不浪费时间。

#### 📈 模块七：跨篇进步追踪

做 3+ 篇后会自动生成进步趋势表，识别你最常犯的错误类型，给出针对性提升建议。

---

## 🔗 在线复盘系统

不用安装 Skill，直接在线使用：

| 平台 | 地址 | 状态 |
|------|------|------|
| 🌐 Web 版 | https://tuyaya.online/ielts/ | ✅ 已上线 |
| 📱 微信小程序 | 搜索「雅思阅读复盘」 | 🚧 开发中 |

---

## 📥 导入历史做题记录

如果你之前已经做了很多题，可以把历史记录批量导入，让 AI 从第一天起就知道你的进步轨迹。

### 方法一：跟 AI 说（最简单）

```
我之前做过这些题，帮我录入历史记录：
剑4-T1-P1: 9/14, 25min
剑4-T1-P2: 8/12, 30min
剑4-T1-P3: 6/14, 35min
```

### 方法二：贴一个列表

```
Book | Test | Passage | Score | Total | Time | Date
4    | 1    | 1       | 9     | 14    | 25   | 2026-03-15
4    | 1    | 2       | 8     | 12    | 30   | 2026-03-15
```

### 方法三：用导入脚本

```bash
node scripts/batch-import.js --file my-records.csv
```

### 方法四：在线版直接录入

访问 https://tuyaya.online/ielts/ ，在「历史记录」页面手动添加。

### 方法五：用 API 直接导入

```bash
curl -X POST 'https://tuyaya.online/api/ielts' \
  -H 'Content-Type: application/json' \
  -d '{"action":"batchImport","token":"YOUR_TOKEN","reviews":[
    {"book":4,"test":1,"passage":1,"score":9,"total":14,"date":"2026-03-15"},
    {"book":4,"test":1,"passage":2,"score":8,"total":12,"date":"2026-03-15"}
  ]}'
```

---

## 🎯 Features

| 功能 | 说明 |
|------|------|
| **逐题错因分析** | 定位原文、映射同义替换、分类错因（12 类）、给出 1 句话教训 |
| **正确题确认** | 正确答案也简要展示同义替换映射，强化记忆 |
| **同义替换积累** | 自动提取题目-原文同义替换对，跨篇持续积累 |
| **考点词标注** | 基于刘洪波 538 考点词（⭐⭐⭐/⭐⭐/⭐）+ COCA 5000 词频 |
| **易错模式追踪** | 跨篇检测反复犯的错（如总把 NG 选成 FALSE） |
| **📋 填空回填检查** | 每道填空题 4 步强制验证（语法/词性/语义/字数），杜绝低级失误 |
| **📈 题型进步趋势** | 按题型统计正确率变化，可视化展示进步曲线 |
| **📊 打分 & Band 换算** | 每套题自动算分，原始分→雅思 Band 分数换算（学术类） |
| **📈 进步趋势统计** | 多套考试成绩汇总表 + 正确率/速度趋势分析 |
| **⏱️ 分段计时** | 记录 P1/P2/P3 各段用时，对比 60 分钟考试限时 |
| **HTML + PDF 输出** | 排版专业的复盘笔记，支持打印和存档 |

## 📂 File Structure

```
ielts-reading-review/
├── SKILL.md                          # Skill 定义（AI 读这个文件理解工作流）
├── README.md                         # 使用说明（你正在看的这个）
├── assets/
│   └── review-template.html          # HTML 模板 + CSS 样式
├── references/
│   ├── error-taxonomy.md             # 12 类错误分类体系
│   ├── 538-keywords-guide.md         # 考点词评级指南
│   ├── score-band-table.md           # 分数→Band 换算表
│   └── review-style-guide.md         # 写作风格规范
└── scripts/
    ├── generate-pdf.js               # PDF 生成脚本
    └── batch-import.js               # 历史数据批量导入脚本
```

## 🧠 内置做题方法论

### T/F/NG 三步判断法
1. **找话题** — 原文有没有讨论题目说的这个话题？→ 没有 → **NOT GIVEN**
2. **找立场** — 如果话题存在，作者同意还是反对？→ **TRUE** / **FALSE**
3. **验证** — "如果我选 TRUE/FALSE，能指出原文哪一句吗？"指不出来 → 大概率 **NOT GIVEN**

### 填空题防重复规则
答案不要重复题目中已有的词。填完后把答案放回原句完整读一遍。

### 选择题逐词验证法
选项中的**每个关键词**都要在原文找到对应。"大致相关" ≠ "能选"。前半句对但后半句多了信息 → 干扰项。

## 👤 Who It's For

雅思备考者，尤其是：
- 阅读 5-7 分想突破的
- 复盘效率低，做完题不知道怎么分析的
- 同样的错反复犯，需要系统追踪的
- 想把词汇积累和真题练习结合起来的

## ⚙️ Requirements

- 支持 SKILL.md 的 AI Agent（如 OpenClaw、Claude Code、WorkBuddy/CodeBuddy）
- PDF 导出需要：Node.js + puppeteer-core + 本地 Chrome（可选，不装也能用 HTML）
- 或者直接用在线版 https://tuyaya.online/ielts/ ，无需安装任何东西

## 🤝 Contact & Feedback

If this Skill helps your IELTS prep, a ⭐ Star would mean a lot!

如果这个 Skill 对你备考有帮助，欢迎点个 ⭐ 支持！

- 💡 **Feature requests / Bug reports**: [Open an Issue](https://github.com/dengjiawei1226/ielts-reading-review/issues)

## License

MIT-0

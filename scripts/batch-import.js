/**
 * 雅思复盘历史数据批量导入脚本
 * 
 * 从已有的复盘 HTML、Markdown 记忆文件、笔记等多种来源
 * 自动提取得分，并批量导入到云端。
 * 
 * 用法：
 *   node batch-import.js --dir <目录> --token <TOKEN>
 *   node batch-import.js --files "file1.html,file2.html" --token <TOKEN>
 *   node batch-import.js --scan <workspace_path> --token <TOKEN>
 *   node batch-import.js --dir <目录> --token <TOKEN> --dry-run
 * 
 * 参数：
 *   --dir <path>      扫描目录下所有 剑X-TestX-PassageX-*.html 文件
 *   --files <list>    逗号分隔的文件路径列表
 *   --scan <path>     智能扫描工作空间（HTML + Markdown + 记忆文件）
 *   --token <token>   用户登录 Token（从个人中心页面获取）
 *   --dry-run         仅展示将导入的数据，不实际调用 API
 *   --date <date>     为所有记录指定统一日期（YYYY-MM-DD），默认使用文件修改时间
 * 
 * 示例：
 *   node batch-import.js --dir ./reviews --token eyJ1Ijoi... 
 *   node batch-import.js --scan /Users/alice/雅思学习 --token eyJ1Ijoi... --dry-run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://tuyaya.online/api/ielts';

// ─── 参数解析 ───────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dir: null, files: null, scan: null, token: null, dryRun: false, date: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir':
        opts.dir = args[++i];
        break;
      case '--files':
        opts.files = args[++i].split(',').map(f => f.trim());
        break;
      case '--scan':
        opts.scan = args[++i];
        break;
      case '--token':
        opts.token = args[++i];
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--date':
        opts.date = args[++i];
        break;
      default:
        console.error(`未知参数: ${args[i]}`);
        process.exit(1);
    }
  }

  if (!opts.token) {
    console.error('❌ 必须提供 --token 参数');
    console.error('   Token 可在个人中心页面获取，或通过登录 API 获得');
    process.exit(1);
  }

  if (!opts.dir && !opts.files && !opts.scan) {
    console.error('❌ 必须提供 --dir、--files 或 --scan 参数');
    console.error('   --dir ./reviews          扫描目录下所有复盘 HTML');
    console.error('   --files "a.html,b.html"  指定文件列表');
    console.error('   --scan /path/to/workspace 智能扫描整个工作空间');
    process.exit(1);
  }

  return opts;
}

// ─── 文件发现 ───────────────────────────────────────────────

const HTML_PATTERN = /^剑(\d+)-Test(\d+)-Passage(\d+)-.+\.html$/;
const PDF_PATTERN = /^剑(\d+)-Test(\d+)-Passage(\d+)-.+\.pdf$/;

function discoverHtmlFiles(dir) {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) return [];

  return fs.readdirSync(absDir)
    .filter(f => HTML_PATTERN.test(f))
    .map(f => path.join(absDir, f))
    .sort();
}

function discoverMarkdownFiles(dir) {
  const absDir = path.resolve(dir);
  if (!fs.existsSync(absDir)) return [];

  return fs.readdirSync(absDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(absDir, f))
    .sort();
}

/**
 * 递归查找工作空间中所有可能包含成绩的文件
 */
function scanWorkspace(rootDir) {
  const absRoot = path.resolve(rootDir);
  if (!fs.existsSync(absRoot)) {
    console.error(`❌ 工作空间不存在: ${absRoot}`);
    process.exit(1);
  }

  const found = { html: [], markdown: [], pdf: [] };

  function walk(dir, depth) {
    if (depth > 5) return; // 限制递归深度
    const skipDirs = ['node_modules', '.git', 'backup_old_v1', 'ielts-reading-review'];
    
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          walk(fullPath, depth + 1);
        }
        continue;
      }

      if (HTML_PATTERN.test(entry.name)) {
        found.html.push(fullPath);
      } else if (PDF_PATTERN.test(entry.name)) {
        found.pdf.push(fullPath);
      } else if (entry.name.endsWith('.md')) {
        found.markdown.push(fullPath);
      }
    }
  }

  walk(absRoot, 0);

  // 也扫描 .workbuddy/memory/ 目录
  const memoryDir = path.join(absRoot, '.workbuddy', 'memory');
  if (fs.existsSync(memoryDir)) {
    const mdFiles = discoverMarkdownFiles(memoryDir);
    for (const f of mdFiles) {
      if (!found.markdown.includes(f)) {
        found.markdown.push(f);
      }
    }
  }

  return found;
}

// ─── 得分提取器 ──────────────────────────────────────────────

/**
 * 从标准复盘 HTML 中提取得分
 */
function extractFromHtml(filePath) {
  const filename = path.basename(filePath);
  const match = filename.match(HTML_PATTERN);
  if (!match) return [];

  const [, book, test, passage] = match.map(Number);
  const html = fs.readFileSync(filePath, 'utf-8');

  // 匹配 <div class="stat-value">X/Y</div>
  const scoreMatch = html.match(/<div\s+class="stat-value">\s*(\d+)\s*\/\s*(\d+)\s*<\/div>/);
  if (!scoreMatch) {
    console.warn(`⚠️  无法从 HTML 中提取得分: ${filename}`);
    return [];
  }

  const score = parseInt(scoreMatch[1], 10);
  const total = parseInt(scoreMatch[2], 10);
  const stat = fs.statSync(filePath);
  const fileDate = stat.mtime.toISOString().slice(0, 10);

  return [{ book, test, passage, score, total, fileDate, source: filename }];
}

/**
 * 从 Markdown 文件中提取成绩数据
 * 
 * 支持的格式：
 *   - 剑4T1: P1=9/14, P2=8/12
 *   - 剑4 Test1 Passage1 得了 9 分（共14题）
 *   - | P1 | 9/14 |
 *   - 剑4T1(6.0) → 剑4T2(4.0)  （这是 band score，需要反推）
 *   - 剑5-Test2-Passage1: 8/13
 *   - Book 5 Test 2 P1: 8/13
 */
function extractFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  const results = [];
  const seen = new Set();

  // 模式1: 剑X-TestY-PassageZ ... A/B  或  剑X TY PZ: A/B
  const pattern1 = /剑(\d+)[-\s]*(?:Test|T)(\d+)[-\s]*(?:Passage|P)(\d+)[^\d]*?(\d+)\s*\/\s*(\d+)/gi;
  let m;
  while ((m = pattern1.exec(content)) !== null) {
    const key = `${m[1]}-${m[2]}-${m[3]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      book: parseInt(m[1]),
      test: parseInt(m[2]),
      passage: parseInt(m[3]),
      score: parseInt(m[4]),
      total: parseInt(m[5]),
      fileDate: getFileDate(filePath),
      source: `${filename} (markdown-pattern1)`
    });
  }

  // 模式2: Markdown 表格行 — | 剑4T1P1 | 9/14 | 或 | P1 | 9 | 14 |
  // 需要结合上下文找到 book/test 信息
  const tablePattern = /\|\s*(?:P|Passage\s*)(\d+)\s*\|\s*(\d+)\s*\/\s*(\d+)\s*\|/gi;
  // 先尝试从上下文找 book+test
  const contextPattern = /剑(\d+)[-\s]*(?:Test|T)(\d+)/gi;
  const contexts = [];
  while ((m = contextPattern.exec(content)) !== null) {
    contexts.push({ book: parseInt(m[1]), test: parseInt(m[2]), pos: m.index });
  }

  while ((m = tablePattern.exec(content)) !== null) {
    // 找最近的上下文
    let ctx = null;
    for (const c of contexts) {
      if (c.pos <= m.index) ctx = c;
    }
    if (!ctx) continue;

    const key = `${ctx.book}-${ctx.test}-${m[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      book: ctx.book,
      test: ctx.test,
      passage: parseInt(m[1]),
      score: parseInt(m[2]),
      total: parseInt(m[3]),
      fileDate: getFileDate(filePath),
      source: `${filename} (markdown-table)`
    });
  }

  // 模式3: 得了X分（共Y题）格式
  const pattern3 = /剑(\d+)[-\s]*(?:Test|T)(\d+)[-\s]*(?:Passage|P)(\d+)[^\d]*?得了?\s*(\d+)\s*分[^\d]*?(?:共|满分|总共)\s*(\d+)\s*题/gi;
  while ((m = pattern3.exec(content)) !== null) {
    const key = `${m[1]}-${m[2]}-${m[3]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      book: parseInt(m[1]),
      test: parseInt(m[2]),
      passage: parseInt(m[3]),
      score: parseInt(m[4]),
      total: parseInt(m[5]),
      fileDate: getFileDate(filePath),
      source: `${filename} (markdown-pattern3)`
    });
  }

  // 模式4: 带上下文的紧凑格式 — P1=9/14, P2=8/12, P3=9/14
  // 需先找到 剑X TY 然后匹配后续的 PZ=A/B
  const blockPattern = /剑(\d+)[-\s]*(?:Test|T)(\d+)[：:\s]*(?:P|Passage\s*)(\d+)\s*[=:：]\s*(\d+)\s*\/\s*(\d+)/gi;
  while ((m = blockPattern.exec(content)) !== null) {
    const key = `${m[1]}-${m[2]}-${m[3]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      book: parseInt(m[1]),
      test: parseInt(m[2]),
      passage: parseInt(m[3]),
      score: parseInt(m[4]),
      total: parseInt(m[5]),
      fileDate: getFileDate(filePath),
      source: `${filename} (markdown-block)`
    });
  }

  return results;
}

function getFileDate(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ─── API 调用 ───────────────────────────────────────────────

function callAPI(token, reviews) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      action: 'batchImport',
      token,
      reviews
    });

    const url = new URL(API_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`API 返回非 JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('API 请求超时')); });
    req.write(payload);
    req.end();
  });
}

// ─── 去重 ───────────────────────────────────────────────────

/**
 * 按 book+test+passage 去重，保留最高分
 */
function deduplicateResults(results) {
  const map = new Map();
  for (const r of results) {
    const key = `${r.book}-${r.test}-${r.passage}`;
    const existing = map.get(key);
    if (!existing || r.score > existing.score) {
      map.set(key, r);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.book !== b.book) return a.book - b.book;
    if (a.test !== b.test) return a.test - b.test;
    return a.passage - b.passage;
  });
}

// ─── 主流程 ─────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  let allResults = [];

  // ─── 模式1: --dir（只扫 HTML）─────────────────────────
  if (opts.dir) {
    const files = discoverHtmlFiles(opts.dir);
    if (files.length === 0) {
      console.error(`❌ 目录中没有找到符合 "剑X-TestX-PassageX-*.html" 格式的文件`);
      console.error(`   目录: ${path.resolve(opts.dir)}`);
      process.exit(1);
    }
    console.log(`📂 找到 ${files.length} 个复盘 HTML 文件\n`);
    for (const f of files) {
      allResults.push(...extractFromHtml(f));
    }
  }

  // ─── 模式2: --files（指定文件）─────────────────────────
  if (opts.files) {
    for (const f of opts.files) {
      const absF = path.resolve(f);
      if (!fs.existsSync(absF)) {
        console.error(`❌ 文件不存在: ${absF}`);
        process.exit(1);
      }
      if (absF.endsWith('.html')) {
        allResults.push(...extractFromHtml(absF));
      } else if (absF.endsWith('.md')) {
        allResults.push(...extractFromMarkdown(absF));
      } else {
        console.warn(`⚠️  跳过不支持的文件格式: ${path.basename(absF)}`);
        console.warn(`   支持的格式: .html, .md`);
        console.warn(`   PDF 文件请让 AI 助手读取并手动导入`);
      }
    }
  }

  // ─── 模式3: --scan（智能扫描工作空间）───────────────────
  if (opts.scan) {
    console.log(`🔍 智能扫描工作空间: ${path.resolve(opts.scan)}\n`);
    const found = scanWorkspace(opts.scan);

    console.log(`   📄 复盘 HTML:  ${found.html.length} 个文件`);
    console.log(`   📝 Markdown:   ${found.markdown.length} 个文件`);
    console.log(`   📕 PDF:        ${found.pdf.length} 个文件（需 AI 辅助提取）`);
    console.log('');

    // 处理 HTML
    for (const f of found.html) {
      allResults.push(...extractFromHtml(f));
    }

    // 处理 Markdown
    for (const f of found.markdown) {
      const mdResults = extractFromMarkdown(f);
      if (mdResults.length > 0) {
        console.log(`   ✅ ${path.basename(f)}: 提取到 ${mdResults.length} 条成绩`);
      }
      allResults.push(...mdResults);
    }

    // PDF 无法直接处理，给出提示
    if (found.pdf.length > 0) {
      console.log(`\n   ℹ️  发现 ${found.pdf.length} 个 PDF 文件，无法自动提取：`);
      for (const f of found.pdf) {
        console.log(`      - ${path.relative(opts.scan, f)}`);
      }
      console.log('   请让 AI 助手读取 PDF 内容并手动导入，或直接告诉 AI 你的得分。\n');
    }
  }

  // ─── 去重 ─────────────────────────────────────────────
  allResults = deduplicateResults(allResults);

  if (allResults.length === 0) {
    console.error('❌ 没有成功提取到任何得分数据');
    console.error('   可能的原因：');
    console.error('   - HTML 文件不是标准复盘格式');
    console.error('   - Markdown 文件中没有包含标准得分格式');
    console.error('   - 请尝试让 AI 助手直接分析你的文件');
    process.exit(1);
  }

  // ─── 构建导入数据 ─────────────────────────────────────
  const reviews = allResults.map(r => ({
    book: r.book,
    test: r.test,
    passage: r.passage,
    score: r.score,
    total: r.total,
    date: opts.date || r.fileDate
  }));

  // ─── 展示导入预览 ─────────────────────────────────────
  console.log('');
  console.log('┌──────────────────────┬───────┬────────────┬─────────────────────────────────┐');
  console.log('│ 来源                 │ 得分  │ 日期       │ 数据来源文件                    │');
  console.log('├──────────────────────┼───────┼────────────┼─────────────────────────────────┤');
  for (let i = 0; i < allResults.length; i++) {
    const r = allResults[i];
    const src = `剑${r.book} T${r.test} P${r.passage}`.padEnd(20);
    const score = `${r.score}/${r.total}`.padEnd(5);
    const date = reviews[i].date;
    const file = (r.source || '').slice(0, 31).padEnd(31);
    console.log(`│ ${src} │ ${score} │ ${date} │ ${file} │`);
  }
  console.log('└──────────────────────┴───────┴────────────┴─────────────────────────────────┘');
  console.log(`\n共 ${reviews.length} 条记录（已按 book+test+passage 去重，保留最高分）\n`);

  // ─── 执行导入或 dry run ───────────────────────────────
  if (opts.dryRun) {
    console.log('🔍 Dry run 模式 — 以上数据未实际导入');
    console.log('   移除 --dry-run 参数后重新运行即可导入');
    return;
  }

  console.log('🚀 正在导入...');
  try {
    const result = await callAPI(opts.token, reviews);
    if (result.success) {
      console.log(`\n✅ 导入成功！共 ${result.imported || reviews.length} 条记录`);
      console.log('   刷新个人中心即可查看统计数据');
    } else {
      console.error(`\n❌ 导入失败: ${result.error || JSON.stringify(result)}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ 请求失败: ${err.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`❌ 未知错误: ${err.message}`);
  process.exit(1);
});

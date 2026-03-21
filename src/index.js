import readline from 'readline';
import dotenv from 'dotenv';
import { recognizeIntent } from './agent/intent.js';
import { searchProjects } from './agent/search.js';
import { executeQuery } from './agent/query.js';
import { formatResult } from './agent/formatter.js';
import { closePool } from './db/client.js';

dotenv.config({ override: true });

const QUERY_TYPE_LABEL = {
  invoice: '开票情况',
  payment: '回款情况',
  cost:    '成本情况',
  profit:  '利润情况',
  unknown: '未知查询',
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function prompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function displayProjectList(projects) {
  console.log('\n找到以下匹配项目，请输入序号选择：');
  projects.forEach((p, i) => {
    const label = p.name || p.fullName;
    console.log(`  ${i + 1}. [${p.company}] ${label}`);
  });
  console.log('  0. 取消');
}

async function handleProjectQuery(project, queryType) {
  console.log(`\n正在查询 [${project.company}] ${project.name || project.fullName} 的${QUERY_TYPE_LABEL[queryType]}...`);
  try {
    const result = await executeQuery(project.id, project.company, queryType);
    if (!result) {
      console.log('未查询到数据，请确认项目信息是否完整。');
    } else {
      console.log('\n' + '─'.repeat(40));
      console.log(formatResult(queryType, result));
      console.log('─'.repeat(40));
    }
  } catch (err) {
    console.error('查询失败：', err.message);
  }
}

async function main() {
  console.log('═'.repeat(50));
  console.log('  项目信息智能问答助手');
  console.log('  输入 "退出" 或 "exit" 结束程序');
  console.log('═'.repeat(50));
  console.log('示例：万科项目开票情况怎么样？\n');

  // state: { type: 'idle' } | { type: 'waiting_selection', projects, queryType }
  let state = { type: 'idle' };

  while (true) {
    const input = (await prompt('> ')).trim();
    if (!input) continue;
    if (input === '退出' || input === 'exit') break;

    // ── 等待用户选择项目 ──────────────────────────────────────────────────
    if (state.type === 'waiting_selection') {
      const num = parseInt(input);
      if (input === '0' || isNaN(num)) {
        console.log('已取消。');
        state = { type: 'idle' };
        continue;
      }
      const selected = state.projects[num - 1];
      if (!selected) {
        console.log(`请输入 1 到 ${state.projects.length} 之间的数字。`);
        continue;
      }
      const qt = state.queryType;
      state = { type: 'idle' };
      await handleProjectQuery(selected, qt);
      continue;
    }

    // ── 正常问答流程 ──────────────────────────────────────────────────────
    console.log('正在识别意图...');
    let intent;
    try {
      intent = await recognizeIntent(input);
    } catch (err) {
      console.error('意图识别失败：', err.message);
      continue;
    }

    if (intent.queryType === 'unknown' || !intent.projectKeyword) {
      console.log('抱歉，我无法理解您的问题。请尝试：\n  "XX项目开票情况怎么样？"\n  "XX项目回款情况怎么样？"\n  "XX项目成本情况怎么样？"');
      continue;
    }

    console.log(`识别到：项目关键词="${intent.projectKeyword}"，查询类型="${QUERY_TYPE_LABEL[intent.queryType]}"`);
    console.log('正在搜索项目...');

    let projects;
    try {
      projects = await searchProjects(intent.projectKeyword);
    } catch (err) {
      console.error('数据库查询失败：', err.message);
      continue;
    }

    if (projects.length === 0) {
      console.log(`未找到包含"${intent.projectKeyword}"的项目，请检查项目名称是否正确。`);
    } else if (projects.length === 1) {
      await handleProjectQuery(projects[0], intent.queryType);
    } else {
      displayProjectList(projects);
      state = { type: 'waiting_selection', projects, queryType: intent.queryType };
    }
  }

  console.log('\n再见！');
  rl.close();
  await closePool();
}

main().catch((err) => {
  console.error('程序异常退出：', err);
  process.exit(1);
});


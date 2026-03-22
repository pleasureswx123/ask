import express from 'express';
import dotenv from 'dotenv';
import { recognizeIntent } from './agent/intent.js';
import { searchProjects } from './agent/search.js';
import { executeQuery } from './agent/query.js';
import { formatResult } from './agent/formatter.js';
import { closePool } from './db/client.js';

dotenv.config({ override: true });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const QUERY_TYPE_MAP = {
  invoice: 'invoice', payment: 'payment', cost: 'cost', profit: 'profit',
  开票: 'invoice', 回款: 'payment', 成本: 'cost', 利润: 'profit',
};

const COMPANY_MAP = {
  凡高: '凡高', fangao: '凡高', Fangao: '凡高', FanGao: '凡高',
  文森特: '文森特', vincent: '文森特', Vincent: '文森特',
};

// 各公司可查看人员 ID 集合（avatarImageUrl cookie 值）
const FANGAO_MEMBERS  = new Set(['6676269582040844867', '-3309927987368277301', '-4569568685448475789', '-1577376760741084847', '7525471032519182589', '-6266408735092551688']);
const WUSENTE_MEMBERS = new Set(['6676269582040844867', '-8979920820177776653', '-4569568685448475789', '-1577376760741084847', '7525471032519182589', '3639139703738680197', '2881187117907003637']);

/**
 * 解析人员 ID，优先取 query/body 中的 memberId 参数，
 * 跨域 cookie 带不过来时可通过此参数显式传递；
 * 兜底从 cookie 的 avatarImageUrl 字段读取。
 */
function parseMemberId(req) {
  const explicit = (req.query.memberId || req.body?.memberId || '').trim();
  if (explicit) return explicit;

  return (req.headers.cookie || '')
    .split('; ')
    .find(row => row.startsWith('avatarImageUrl='))
    ?.split('=')[1]
    ?.trim() || '';
}

/**
 * 健康检查
 * GET /health
 */

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * 权限查询接口
 * GET /auth/scope
 * 根据请求 cookie 中的 avatarImageUrl（人员ID）返回可查看的公司范围
 * 返回：{ companyScope: 0 | 1 | 2 }
 *   0 = 全部（凡高 + 文森特）
 *   1 = 仅凡高
 *   2 = 仅文森特
 */
app.get('/auth/scope', (req, res) => {
  const memberId = parseMemberId(req);
  if (!memberId) {
    return res.status(401).json({ error: '未获取到人员身份，请确认 cookie 中包含 avatarImageUrl' });
  }

  const inFangao  = FANGAO_MEMBERS.has(memberId);
  const inWusente = WUSENTE_MEMBERS.has(memberId);

  if (!inFangao && !inWusente) {
    return res.status(403).json({ error: '无权限查看任何公司项目' });
  }

  let companyScope;
  if (inFangao && inWusente) {
    companyScope = 0;
  } else if (inFangao) {
    companyScope = 1;
  } else {
    companyScope = 2;
  }

  res.json({ companyScope });
});

/**
 * 意图识别接口
 * POST /intent
 * Body: { text }
 * 从自然语言中提取项目关键词和查询类型
 */
app.post('/intent', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: '缺少参数 text' });
  }
  try {
    const result = await recognizeIntent(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 项目搜索接口
 * GET /projects?keyword=xxx
 * 返回匹配的项目列表，供 Coze 展示给用户选择
 */
app.get('/projects', async (req, res) => {
  const { keyword } = req.query;
  const companyScope = Number(req.query.companyScope) || 0;
  if (!keyword) {
    return res.status(400).json({ error: '缺少参数 keyword' });
  }
  try {
    const projects = await searchProjects(keyword, companyScope);
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 项目信息查询接口（核心接口）
 * POST /query
 * Body: { projectId, company, queryType }
 *   - projectId: 项目ID（从 /projects 接口获取）
 *   - company: "凡高" | "文森特"
 *   - queryType: "invoice" | "payment" | "cost"
 */
app.post('/query/detail', async (req, res) => {
  const { projectId } = req.body;
  const queryType = QUERY_TYPE_MAP[req.body.queryType];
  const company = COMPANY_MAP[req.body.company];

  if (!projectId || !company || !queryType) {
    return res.status(400).json({ error: '缺少参数，需要 projectId、company（凡高/文森特）、queryType（invoice/payment/cost）' });
  }

  try {
    const data = await executeQuery(projectId, company, queryType);
    if (!data) {
      return res.status(404).json({ error: '未找到该项目数据' });
    }
    const formatted = formatResult(queryType, data);
    res.json({ result: formatted, raw: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 一体化查询接口（Coze 推荐使用此接口）
 * POST /query/search
 * Body: { keyword, queryType }
 * 当只匹配到一个项目时直接返回结果；
 * 匹配到多个时返回项目列表供用户选择。
 */
app.post('/query/search', async (req, res) => {
  const { keyword } = req.body;
  const queryType = QUERY_TYPE_MAP[req.body.queryType];
  const companyScope = Number(req.body.companyScope) || 0;

  if (!keyword || !queryType) {
    return res.status(400).json({ error: '缺少参数，需要 keyword 和 queryType（invoice/payment/cost 或 开票/回款/成本）' });
  }

  try {
    const projects = await searchProjects(keyword, companyScope);

    if (projects.length === 0) {
      return res.json({ type: 'not_found', message: `未找到包含"${keyword}"的项目` });
    }

    if (projects.length > 1) {
      return res.json({ type: 'multiple', projects });
    }

    // 唯一匹配，直接查询
    const project = projects[0];
    const data = await executeQuery(project.id, project.company, queryType);
    if (!data) {
      return res.status(404).json({ error: '未找到该项目数据' });
    }
    const formatted = formatResult(queryType, data);
    res.json({ type: 'single', project, result: formatted, raw: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ 项目信息查询服务已启动：http://localhost:${PORT}`);
  console.log(`   GET  /health          健康检查`);
  console.log(`   GET  /auth/scope      权限查询`);
  console.log(`   POST /intent          意图识别`);
  console.log(`   GET  /projects        搜索项目列表`);
  console.log(`   POST /query/search    一体化查询（Coze 推荐）`);
  console.log(`   POST /query/detail    按项目ID精确查询`);
});

// 优雅退出
process.on('SIGTERM', async () => {
  server.close();
  await closePool();
});


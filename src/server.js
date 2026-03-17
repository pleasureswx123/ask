import express from 'express';
import dotenv from 'dotenv';
import { searchProjects } from './agent/search.js';
import { executeQuery } from './agent/query.js';
import { formatResult } from './agent/formatter.js';
import { closePool } from './db/client.js';

dotenv.config({ override: true });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

/**
 * 健康检查
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * 项目搜索接口
 * GET /projects?keyword=xxx
 * 返回匹配的项目列表，供 Coze 展示给用户选择
 */
app.get('/projects', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '缺少参数 keyword' });
  }
  try {
    const projects = await searchProjects(keyword);
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
app.post('/query', async (req, res) => {
  const { projectId, company, queryType } = req.body;

  if (!projectId || !company || !queryType) {
    return res.status(400).json({ error: '缺少参数，需要 projectId、company、queryType' });
  }
  if (!['凡高', '文森特'].includes(company)) {
    return res.status(400).json({ error: 'company 只能是 "凡高" 或 "文森特"' });
  }
  if (!['invoice', 'payment', 'cost'].includes(queryType)) {
    return res.status(400).json({ error: 'queryType 只能是 "invoice"、"payment"、"cost"' });
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
  const { keyword, queryType } = req.body;

  if (!keyword || !queryType) {
    return res.status(400).json({ error: '缺少参数，需要 keyword 和 queryType' });
  }
  if (!['invoice', 'payment', 'cost'].includes(queryType)) {
    return res.status(400).json({ error: 'queryType 只能是 "invoice"、"payment"、"cost"' });
  }

  try {
    const projects = await searchProjects(keyword);

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
  console.log(`   GET  /projects        搜索项目列表`);
  console.log(`   POST /query/search    一体化查询（Coze 推荐）`);
  console.log(`   POST /query           按项目ID精确查询`);
});

// 优雅退出
process.on('SIGTERM', async () => {
  server.close();
  await closePool();
});


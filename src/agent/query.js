import { query } from '../db/client.js';

// ─── 凡高表 SQL 模板 ────────────────────────────────────────────────────────

const FANGAO_INVOICE_SQL = `
  SELECT field0046 AS 项目简称, field0045 AS 项目类型, field0005 AS 客户名称,
         field0011 AS 项目状态, field0025 AS 项目经理,
         field0052 AS 合同金额, field0053 AS 除税报价, field0242 AS 是否结算,
         field0263 AS 已开票金额合计, field0207 AS 未开票金额合计
  FROM A8V71.dbo.formmain_0040 WHERE ID = @id`;

const FANGAO_PAYMENT_SQL = `
  SELECT field0046 AS 项目简称, field0045 AS 项目类型, field0005 AS 客户名称,
         field0011 AS 项目状态, field0025 AS 项目经理,
         field0052 AS 合同金额, field0053 AS 除税报价, field0242 AS 是否结算,
         field0265 AS 已收货币资金, field0266 AS 已收房抵款金额, field0267 AS 已收其他金额,
         field0264 AS 已收款金额合计, field0213 AS 未收款金额合计
  FROM A8V71.dbo.formmain_0040 WHERE ID = @id`;

const FANGAO_COST_SQL = `
  SELECT field0046 AS 项目简称, field0045 AS 项目类型, field0005 AS 客户名称,
         field0011 AS 项目状态, field0025 AS 项目经理,
         field0052 AS 合同金额, field0053 AS 除税报价, field0242 AS 是否结算,
         field0049 AS 项目已付成本, field0244 AS 应付账款, field0245 AS 项目成本合计
  FROM A8V71.dbo.formmain_0040 WHERE ID = @id`;

// ─── 文森特表 SQL 模板 ──────────────────────────────────────────────────────

const WUSENTE_INVOICE_SQL = `
  SELECT field0046 AS 项目简称, field0045 AS 项目类型, field0005 AS 客户名称,
         field0011 AS 项目状态, field0025 AS 项目经理,
         field0052 AS 合同金额, field0053 AS 除税报价, field0245 AS 是否结算,
         field0268 AS 已开票金额合计, field0205 AS 未开票金额合计
  FROM A8V71.dbo.formmain_0163 WHERE ID = @id`;

const WUSENTE_PAYMENT_SQL = `
  SELECT field0046 AS 项目简称, field0045 AS 项目类型, field0005 AS 客户名称,
         field0011 AS 项目状态, field0025 AS 项目经理,
         field0052 AS 合同金额, field0053 AS 除税报价, field0245 AS 是否结算,
         field0270 AS 已收货币资金, field0271 AS 已收房抵款金额, field0272 AS 已收其他金额,
         field0269 AS 已收款金额合计, field0210 AS 未收款金额合计
  FROM A8V71.dbo.formmain_0163 WHERE ID = @id`;

const WUSENTE_COST_SQL = `
  SELECT field0046 AS 项目简称, field0045 AS 项目类型, field0005 AS 客户名称,
         field0011 AS 项目状态, field0025 AS 项目经理,
         field0052 AS 合同金额, field0053 AS 除税报价, field0245 AS 是否结算,
         field0049 AS 项目已付成本, field0250 AS 应付账款, field0252 AS 项目成本合计
  FROM A8V71.dbo.formmain_0163 WHERE ID = @id`;

// ─── SQL 路由表 ─────────────────────────────────────────────────────────────

const SQL_MAP = {
  凡高:  { invoice: FANGAO_INVOICE_SQL,  payment: FANGAO_PAYMENT_SQL,  cost: FANGAO_COST_SQL  },
  文森特: { invoice: WUSENTE_INVOICE_SQL, payment: WUSENTE_PAYMENT_SQL, cost: WUSENTE_COST_SQL },
};

/** 根据项目ID、所属公司、查询类型执行预定义SQL */
export async function executeQuery(projectId, company, queryType) {
  const sqlText = SQL_MAP[company][queryType];
  const rows = await query(sqlText, { id: projectId });
  return rows[0] ?? null;
}


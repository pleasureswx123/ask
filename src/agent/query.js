import { query } from '../db/client.js';

// ─── 凡高表 SQL 模板 ────────────────────────────────────────────────────────

const FANGAO_INVOICE_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0263 AS 已开票金额合计, p.field0207 AS 未开票金额合计
  FROM A8V71.dbo.formmain_0040 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0242
  WHERE p.ID = @id`;

const FANGAO_PAYMENT_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0265 AS 已收货币资金, p.field0266 AS 已收房抵款金额, p.field0267 AS 已收其他金额,
         p.field0264 AS 已收款金额合计, p.field0213 AS 未收款金额合计
  FROM A8V71.dbo.formmain_0040 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0242
  WHERE p.ID = @id`;

const FANGAO_COST_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0049 AS 项目已付成本, p.field0244 AS 应付账款, p.field0245 AS 项目成本合计
  FROM A8V71.dbo.formmain_0040 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0242
  WHERE p.ID = @id`;

// ─── 文森特表 SQL 模板 ──────────────────────────────────────────────────────

const WUSENTE_INVOICE_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0268 AS 已开票金额合计, p.field0205 AS 未开票金额合计
  FROM A8V71.dbo.formmain_0163 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0245
  WHERE p.ID = @id`;

const WUSENTE_PAYMENT_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0270 AS 已收货币资金, p.field0271 AS 已收房抵款金额, p.field0272 AS 已收其他金额,
         p.field0269 AS 已收款金额合计, p.field0210 AS 未收款金额合计
  FROM A8V71.dbo.formmain_0163 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0245
  WHERE p.ID = @id`;

const WUSENTE_COST_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0049 AS 项目已付成本, p.field0250 AS 应付账款, p.field0252 AS 项目成本合计
  FROM A8V71.dbo.formmain_0163 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0245
  WHERE p.ID = @id`;

// ─── 利润 SQL 模板 ──────────────────────────────────────────────────────────

const FANGAO_PROFIT_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0236 AS 完工进度,
         p.field0138 AS 目标利润, p.field0248 AS 目标利润率,
         p.field0246 AS 项目利润, p.field0252 AS 项目利润率
  FROM A8V71.dbo.formmain_0040 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0242
  WHERE p.ID = @id`;

const WUSENTE_PROFIT_SQL = `
  SELECT p.field0046 AS 项目简称, et.SHOWVALUE AS 项目类型, p.field0005 AS 客户名称,
         es.SHOWVALUE AS 项目状态, m.NAME AS 项目经理,
         p.field0052 AS 合同金额, p.field0053 AS 除税报价, eb.SHOWVALUE AS 是否结算,
         p.field0243 AS 完工进度,
         p.field0138 AS 目标利润, p.field0246 AS 目标利润率,
         p.field0253 AS 项目利润, p.field0254 AS 项目利润率
  FROM A8V71.dbo.formmain_0163 p
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM et ON et.ID = p.field0045
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM es ON es.ID = p.field0011
  LEFT JOIN A8V71.dbo.ORG_MEMBER m ON m.ID = p.field0025
  LEFT JOIN A8V71.dbo.CTP_ENUM_ITEM eb ON eb.ID = p.field0245
  WHERE p.ID = @id`;

// ─── SQL 路由表 ─────────────────────────────────────────────────────────────

const SQL_MAP = {
  凡高:  { invoice: FANGAO_INVOICE_SQL,  payment: FANGAO_PAYMENT_SQL,  cost: FANGAO_COST_SQL,  profit: FANGAO_PROFIT_SQL  },
  文森特: { invoice: WUSENTE_INVOICE_SQL, payment: WUSENTE_PAYMENT_SQL, cost: WUSENTE_COST_SQL, profit: WUSENTE_PROFIT_SQL },
};

/** 根据项目ID、所属公司、查询类型执行预定义SQL */
export async function executeQuery(projectId, company, queryType) {
  const sqlText = SQL_MAP[company][queryType];
  const rows = await query(sqlText, { id: projectId });
  return rows[0] ?? null;
}


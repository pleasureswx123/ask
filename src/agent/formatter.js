/** 格式化金额：null 显示为"暂无数据"，否则保留两位小数并加千分位 */
function fmt(val) {
  if (val === null || val === undefined) return '暂无数据';
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 格式化字符串：null/空 显示为"暂无数据" */
function fmtStr(val) {
  return (val && String(val).trim()) || '暂无数据';
}

/** 格式化百分比：null 显示为"暂无数据"，否则乘以100保留两位小数并加 % */
function fmtPct(val) {
  if (val === null || val === undefined) return '暂无数据';
  return (Number(val) * 100).toFixed(2) + '%';
}

function formatInvoice(data) {
  return [
    `项目简称：${fmtStr(data['项目简称'])}`,
    `项目类型：${fmtStr(data['项目类型'])}`,
    `客户名称：${fmtStr(data['客户名称'])}`,
    `项目状态：${fmtStr(data['项目状态'])}`,
    `项目经理：${fmtStr(data['项目经理'])}`,
    `合同金额：${fmt(data['合同金额'])}`,
    `除税报价：${fmt(data['除税报价'])}`,
    `是否结算：${fmtStr(data['是否结算'])}`,
    `已开票金额合计：${fmt(data['已开票金额合计'])}`,
    `未开票金额合计：${fmt(data['未开票金额合计'])}`,
  ].join('\n');
}

function formatPayment(data) {
  return [
    `项目简称：${fmtStr(data['项目简称'])}`,
    `项目类型：${fmtStr(data['项目类型'])}`,
    `客户名称：${fmtStr(data['客户名称'])}`,
    `项目状态：${fmtStr(data['项目状态'])}`,
    `项目经理：${fmtStr(data['项目经理'])}`,
    `合同金额：${fmt(data['合同金额'])}`,
    `除税报价：${fmt(data['除税报价'])}`,
    `是否结算：${fmtStr(data['是否结算'])}`,
    `已收货币资金：${fmt(data['已收货币资金'])}`,
    `已收房抵款金额：${fmt(data['已收房抵款金额'])}`,
    `已收其他金额：${fmt(data['已收其他金额'])}`,
    `已收款金额合计：${fmt(data['已收款金额合计'])}`,
    `未收款金额合计：${fmt(data['未收款金额合计'])}`,
  ].join('\n');
}

function formatCost(data) {
  return [
    `项目简称：${fmtStr(data['项目简称'])}`,
    `项目类型：${fmtStr(data['项目类型'])}`,
    `客户名称：${fmtStr(data['客户名称'])}`,
    `项目状态：${fmtStr(data['项目状态'])}`,
    `项目经理：${fmtStr(data['项目经理'])}`,
    `合同金额：${fmt(data['合同金额'])}`,
    `除税报价：${fmt(data['除税报价'])}`,
    `是否结算：${fmtStr(data['是否结算'])}`,
    `项目已付成本：${fmt(data['项目已付成本'])}`,
    `应付账款：${fmt(data['应付账款'])}`,
    `项目成本合计：${fmt(data['项目成本合计'])}`,
  ].join('\n');
}

function formatProfit(data) {
  return [
    `项目简称：${fmtStr(data['项目简称'])}`,
    `项目类型：${fmtStr(data['项目类型'])}`,
    `客户名称：${fmtStr(data['客户名称'])}`,
    `项目状态：${fmtStr(data['项目状态'])}`,
    `项目经理：${fmtStr(data['项目经理'])}`,
    `合同金额：${fmt(data['合同金额'])}`,
    `除税报价：${fmt(data['除税报价'])}`,
    `是否结算：${fmtStr(data['是否结算'])}`,
    `完工进度：${fmtPct(data['完工进度'])}`,
    `目标利润：${fmt(data['目标利润'])}`,
    `目标利润率：${fmtPct(data['目标利润率'])}`,
    `项目利润：${fmt(data['项目利润'])}`,
    `项目利润率：${fmtPct(data['项目利润率'])}`,
  ].join('\n');
}

/** 根据查询类型格式化输出 */
export function formatResult(queryType, data) {
  switch (queryType) {
    case 'invoice': return formatInvoice(data);
    case 'payment': return formatPayment(data);
    case 'cost':    return formatCost(data);
    case 'profit':  return formatProfit(data);
    default:        return JSON.stringify(data, null, 2);
  }
}


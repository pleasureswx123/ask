import dotenv from 'dotenv';

dotenv.config({ override: true });

const SYSTEM_PROMPT = `你是一个意图识别助手，负责从用户的问题中提取两个信息：
1. projectKeyword：用户提到的项目关键词（去掉"项目"二字，只保留项目名称的核心部分）
2. queryType：查询类型，只能是以下之一：
   - "invoice"：开票相关（开票、发票、已开票、未开票）
   - "payment"：回款相关（回款、收款、已收款、未收款）
   - "cost"：成本相关（成本、费用、支出、已付、应付）
   - "profit"：利润相关（利润、利润率、盈利、完工进度、目标利润）
   - "unknown"：无法识别

请严格以 JSON 格式返回，不要有任何其他内容：
{"projectKeyword": "xxx", "queryType": "invoice"}`;

/** 使用 LLM 识别用户意图，提取项目关键词和查询类型 */
export async function recognizeIntent(userInput) {
  const res = await fetch(`${process.env.ARK_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ARK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ARK_MODEL,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`ARK API 错误 ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const content = data.output
    ?.find(o => o.type === 'message')
    ?.content?.find(c => c.type === 'output_text')
    ?.text?.trim() ?? '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      projectKeyword: parsed.projectKeyword || '',
      queryType: parsed.queryType || 'unknown',
    };
  } catch {
    return { projectKeyword: '', queryType: 'unknown' };
  }
}


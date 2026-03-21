import { query } from '../db/client.js';

const FANGAO_SELECT = `
    SELECT
      CAST(ID AS VARCHAR(20)) AS id,
      ISNULL(field0046, '') AS name,
      ISNULL(field0003, '') AS fullName,
      N'凡高' AS company
    FROM A8V71.dbo.formmain_0040
    WHERE field0046 LIKE @keyword OR field0003 LIKE @keyword`;

const WUSENTE_SELECT = `
    SELECT
      CAST(ID AS VARCHAR(20)) AS id,
      ISNULL(field0046, '') AS name,
      ISNULL(field0003, '') AS fullName,
      N'文森特' AS company
    FROM A8V71.dbo.formmain_0163
    WHERE field0046 LIKE @keyword OR field0003 LIKE @keyword`;

/**
 * 在凡高和文森特两张表中模糊搜索项目
 * 同时匹配 field0046（项目简称）和 field0003（项目名称）
 * @param {string} keyword - 搜索关键词
 * @param {0|1|2} [companyScope=0] - 公司范围：0=全部，1=仅凡高，2=仅文森特
 */
export async function searchProjects(keyword, companyScope = 0) {
  let body;
  if (companyScope === 1) {
    body = FANGAO_SELECT;
  } else if (companyScope === 2) {
    body = WUSENTE_SELECT;
  } else {
    body = `${FANGAO_SELECT}\n\n    UNION ALL\n${WUSENTE_SELECT}`;
  }

  const sql = `${body}\n\n    ORDER BY company, name`;
  const rows = await query(sql, { keyword: `%${keyword}%` });
  return rows;
}


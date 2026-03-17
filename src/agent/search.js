import { query } from '../db/client.js';

/**
 * 在凡高和文森特两张表中模糊搜索项目
 * 同时匹配 field0046（项目简称）和 field0003（项目名称）
 */
export async function searchProjects(keyword) {
  const sql = `
    SELECT
      CAST(ID AS VARCHAR(20)) AS id,
      ISNULL(field0046, '') AS name,
      ISNULL(field0003, '') AS fullName,
      N'凡高' AS company
    FROM A8V71.dbo.formmain_0040
    WHERE field0046 LIKE @keyword OR field0003 LIKE @keyword

    UNION ALL

    SELECT
      CAST(ID AS VARCHAR(20)) AS id,
      ISNULL(field0046, '') AS name,
      ISNULL(field0003, '') AS fullName,
      N'文森特' AS company
    FROM A8V71.dbo.formmain_0163
    WHERE field0046 LIKE @keyword OR field0003 LIKE @keyword

    ORDER BY company, name
  `;

  const rows = await query(sql, { keyword: `%${keyword}%` });
  return rows;
}


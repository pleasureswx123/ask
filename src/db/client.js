import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1433'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let pool = null;

/** 获取数据库连接池（单例） */
export async function getPool() {
  if (!pool || !pool.connected) {
    pool = await sql.connect(config);
  }
  return pool;
}

/** 执行 SQL 查询，返回结果集 */
export async function query(sqlText, params) {
  const p = await getPool();
  const request = p.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        request.input(key, sql.Numeric, value);
      } else {
        request.input(key, sql.NVarChar, value);
      }
    }
  }

  const result = await request.query(sqlText);
  return result.recordset;
}

/** 关闭连接池 */
export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}


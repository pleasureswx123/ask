# 项目信息问答智能体

通过自然语言查询项目的开票、回款、成本情况，数据来源于 SQL Server 数据库（凡高 & 文森特两张项目主表）。

## 快速开始

**1. 安装依赖**
```bash
pnpm install
```

**2. 配置环境变量**

复制 `.env.example` 为 `.env` 并填入实际配置：
```bash
cp .env.example .env
```

**3. 启动**
```bash
pnpm start
```

## 环境变量说明

| 变量 | 说明 |
|------|------|
| `ARK_API_KEY` | 火山引擎 ARK API Key |
| `ARK_BASE_URL` | `https://ark.cn-beijing.volces.com/api/v3` |
| `ARK_MODEL` | 模型名称，如 `deepseek-v3-2-251201` |
| `DB_HOST` | SQL Server 主机地址 |
| `DB_PORT` | 端口号 |
| `DB_USER` | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 |
| `DB_NAME` | 数据库名称 |

## 使用示例

```
> 大连紫悦府精装项目开票情况怎么样？
> 大华项目回款情况怎么样？
> 营口林昌天铂成本情况怎么样？
> 退出
```

支持三类查询：**开票**、**回款**、**成本**。搜索到多个项目时会列出列表供选择。

## 项目结构

```
src/
├── agent/
│   ├── intent.js      # LLM 意图识别
│   ├── search.js      # 项目模糊搜索（两表 UNION）
│   ├── query.js       # 预定义 SQL 查询
│   └── formatter.js   # 结果格式化输出
├── db/
│   └── client.js      # mssql 连接池
└── index.js           # CLI 交互入口
```


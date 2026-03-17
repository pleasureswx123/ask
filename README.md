# 项目信息问答智能体

通过自然语言查询项目的开票、回款、成本情况，数据来源于 SQL Server 数据库（凡高 & 文森特两张项目主表）。

## 核心架构设计

采用 **意图识别 + 预定义 SQL 模板** 方案，而非让 LLM 自由生成 SQL。

| 设计决策 | 实现方式 |
|---------|---------|
| **意图识别** | LLM 提取项目关键词 + 查询类型，temperature=0 保证稳定性 |
| **项目搜索** | 两表 UNION ALL + LIKE 模糊匹配，参数化查询防 SQL 注入 |
| **多结果处理** | 状态机 `waiting_selection`，列出列表等待用户输入序号 |
| **SQL 安全** | 预定义模板 + 参数绑定，LLM 不接触 SQL 语句本身 |
| **字段差异** | 凡高/文森特字段名不同，各自维护独立 SQL 模板 |

## 完整流程设计

```
用户输入自然语言
       ↓
[Step 1] LLM 意图识别
  提取：项目关键词 + 查询类型（开票/回款/成本）
       ↓
[Step 2] 数据库模糊搜索（两张表 UNION ALL）
  formmain_0040（凡高）+ formmain_0163（文森特）
       ↓
  ┌─────────────┬──────────────────┐
  │  唯一匹配   │    多个匹配      │
  │  直接查询   │  列表让用户选择  │
  └─────────────┴──────────────────┘
       ↓
[Step 3] 执行预定义 SQL 模板
  根据「所属公司 × 查询类型」路由到对应 SQL
       ↓
[Step 4] 格式化输出结果
```

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
agent/
├── src/
│   ├── agent/
│   │   ├── intent.js      # LLM 意图识别（提取项目名 + 查询类型）
│   │   ├── search.js      # 两表 UNION ALL 模糊搜索项目
│   │   ├── query.js       # 预定义 SQL 模板执行（开票/回款/成本）
│   │   └── formatter.js   # 格式化输出
│   ├── db/
│   │   └── client.js      # mssql 连接池，封装 query 方法
│   └── index.js           # CLI 交互入口（readline 状态机）
├── .env.example           # 环境变量模板
├── .gitignore
└── package.json
```


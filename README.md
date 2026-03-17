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

**3. 启动 CLI 模式**（命令行交互）
```bash
pnpm start
```

**3. 启动 HTTP 服务模式**（供 Coze 插件调用）
```bash
pnpm server
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

## HTTP 服务接口（Coze 插件模式）

启动后默认监听 `3000` 端口，可通过 `PORT` 环境变量修改。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/projects?keyword=xxx` | 模糊搜索项目列表 |
| POST | `/query/search` | **一体化查询（Coze 推荐）** |
| POST | `/query` | 按项目ID精确查询 |

### `/query/search` 接口说明

**请求：**
```json
{ "keyword": "大连紫悦府精装", "queryType": "invoice" }
```
`queryType` 取值：`invoice`（开票）、`payment`（回款）、`cost`（成本）

**响应 - 唯一匹配（直接返回结果）：**
```json
{ "type": "single", "project": { "id": "...", "name": "...", "company": "凡高" }, "result": "项目简称：...\n合同金额：..." }
```

**响应 - 多个匹配（返回列表让用户选择）：**
```json
{ "type": "multiple", "projects": [{ "id": "...", "name": "...", "company": "凡高" }, ...] }
```

**响应 - 未找到：**
```json
{ "type": "not_found", "message": "未找到包含\"xxx\"的项目" }
```

## 与 Coze 智能体集成

### 步骤一：部署 HTTP 服务到公网服务器

```bash
# 在服务器上
git clone https://github.com/pleasureswx123/ask.git
cd ask
pnpm install
cp .env.example .env   # 填入实际配置
pnpm server            # 启动，默认 3000 端口
```

### 步骤二：在 Coze 创建插件

1. 打开 [Coze 控制台](https://www.coze.cn) → **插件** → **创建插件**
2. 选择 **在线服务**
3. 导入方式选 **导入 OpenAPI**，上传项目中的 `openapi.yaml` 文件
4. 将 `openapi.yaml` 中的 `servers.url` 替换为你的实际服务地址
5. 保存并发布插件

### 步骤三：在 Coze 智能体中绑定插件

1. 打开你的 Coze 智能体 → **插件** → 添加刚创建的插件
2. 在智能体的 **系统提示词** 中加入以下说明：

```
当用户询问项目的开票、回款、成本情况时，调用「项目信息查询」插件：
- 提取用户提到的项目关键词和查询类型（invoice/payment/cost）
- 调用 searchAndQuery 工具
- 若返回 type=multiple，将项目列表展示给用户选择，再调用 queryByProjectId 查询
- 若返回 type=single，直接将 result 字段内容回复给用户
- 若返回 type=not_found，告知用户未找到该项目
```

### 完整调用流程

```
用户在 Coze 对话："大连紫悦府精装项目开票情况？"
         ↓
Coze 智能体调用插件 POST /query/search
  { keyword: "大连紫悦府精装", queryType: "invoice" }
         ↓
返回 type=single，result 为格式化文本
         ↓
Coze 智能体直接回复用户
```

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
│   ├── server.js          # HTTP 服务入口（Coze 插件模式）
│   └── index.js           # CLI 交互入口（命令行模式）
├── openapi.yaml           # Coze 插件 OpenAPI 描述文件
├── .env.example           # 环境变量模板
├── .gitignore
└── package.json
```


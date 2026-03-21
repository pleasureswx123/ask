# 接口文档

Base URL: `http://localhost:3000`

---

## GET /health

健康检查。

**请求**
```
GET /health
```

**响应**
```json
{ "status": "ok" }
```

---

## GET /auth/scope

根据人员 ID 返回可查看的公司范围。

人员 ID 来源优先级：**显式参数 > cookie**

| companyScope | 含义 |
|---|---|
| 0 | 全部（凡高 + 文森特） |
| 1 | 仅凡高 |
| 2 | 仅文森特 |

**方式一：cookie 自动携带**
```
GET /auth/scope
Cookie: avatarImageUrl=6676269582040844867
```

**方式二：query 参数显式传递（跨域时使用）**
```
GET /auth/scope?memberId=6676269582040844867
```

**响应 - 成功**
```json
{ "companyScope": 0 }
```

**响应 - 未获取到身份（401）**
```json
{ "error": "未获取到人员身份，请确认 cookie 中包含 avatarImageUrl" }
```

**响应 - 无权限（403）**
```json
{ "error": "无权限查看任何公司项目" }
```

---

## GET /projects

模糊搜索项目列表。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| keyword | string | ✅ | 项目关键词 |
| companyScope | number | ❌ | 公司范围，默认 0（全部） |

**请求**
```
GET /projects?keyword=紫悦府&companyScope=1
```

**响应**
```json
{
  "projects": [
    { "id": "123456", "name": "大连紫悦府精装", "fullName": "大连紫悦府精装修工程", "company": "凡高" }
  ]
}
```

---

## POST /query/search

一体化查询接口（Coze 推荐）。搜索项目并直接返回查询结果；匹配到多个项目时返回列表供用户选择。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| keyword | string | ✅ | 项目关键词 |
| queryType | string | ✅ | 查询类型，见下表 |
| companyScope | number | ❌ | 公司范围，默认 0（全部） |

**queryType 取值**

| 值 | 含义 |
|---|---|
| `invoice` / `开票` | 开票情况 |
| `payment` / `回款` | 回款情况 |
| `cost` / `成本` | 成本情况 |
| `profit` / `利润` | 利润情况 |

**请求**
```json
{
  "keyword": "大连紫悦府精装",
  "queryType": "invoice",
  "companyScope": 1
}
```

**响应 - 唯一匹配（直接返回结果）**
```json
{
  "type": "single",
  "project": { "id": "123456", "name": "大连紫悦府精装", "fullName": "大连紫悦府精装修工程", "company": "凡高" },
  "result": "项目简称：大连紫悦府精装\n项目类型：...",
  "raw": { }
}
```

**响应 - 多个匹配（返回列表）**
```json
{
  "type": "multiple",
  "projects": [
    { "id": "123456", "name": "大连紫悦府精装", "fullName": "大连紫悦府精装修工程", "company": "凡高" },
    { "id": "789012", "name": "大连紫悦府软装", "fullName": "大连紫悦府软装工程", "company": "文森特" }
  ]
}
```

**响应 - 未找到**
```json
{ "type": "not_found", "message": "未找到包含\"大连紫悦府精装\"的项目" }
```

---

## POST /query/detail

按项目 ID 精确查询（已通过 `/projects` 或 `/query/search` 获取到项目 ID 后使用）。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| projectId | string | ✅ | 项目 ID |
| company | string | ✅ | 所属公司，见下表 |
| queryType | string | ✅ | 查询类型，同上表 |

**company 取值**：`凡高` / `fangao` / `FanGao` / `文森特` / `vincent` / `Vincent`

**请求**
```json
{
  "projectId": "123456",
  "company": "凡高",
  "queryType": "profit"
}
```

**响应 - 成功**
```json
{
  "result": "项目简称：大连紫悦府精装\n项目类型：...",
  "raw": { }
}
```

**响应 - 未找到（404）**
```json
{ "error": "未找到该项目数据" }
```


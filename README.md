# lbp-growth-calendar

增长日历 CLI 工具 —— Agent AI Friendly 规范

## 特性

- **结构化 JSON 输出**：所有命令默认输出 `{ "ok": true, "data": ... }` 结构，方便 AI Agent 和程序化调用
- **清晰的命令层次**：`auth`（认证）、`dau`（查询）、`events`（增删改查）、`correct-meta`/`correct-event`/`correct`（订正）
- **AI Friendly 原子操作**：订正接口是全量覆盖语义，CLI 提供 `correct-meta` 与 `correct-event add|update|delete` 自动合并当日数据，避免误删
- **全量高级模式**：`correct` 命令支持直接传完整 events 列表或 JSON 文件，适合脚本批处理
- **一致的错误结构**：错误输出 `{ "ok": false, "error": "CODE", "message": "..." }` 且退出码非 0
- **双 Token 认证**：同时携带内置 Token 和用户 API Key，确保安全访问
- **无交互式设计**：所有命令完全非交互式，所有参数通过 CLI 参数或环境变量传入，适合自动化脚本和 AI Agent 调用
- **自主授权流程**：支持 `init` -> 浏览器授权 -> `verify` 的完整 OAuth 风格授权流程

## 安装

```bash
npm install -g lbp-growth-calendar
```

## 快速开始

### 1. 授权流程（获取 Token）

需要两个 Token：
- **Token**（固定，长期有效）：从管理员获取，用于访问 init/verify 接口
- **API Key**（动态，有过期时间）：通过 verify 获取，用于访问业务接口

```bash
# 步骤 1: 提供 Token，发起授权流程
lbp-growth-calendar auth init --token <your-bearer-token>

# 步骤 2: 【用户手动操作】在浏览器中访问输出的 authUrl，完成登录授权
# ⚠️ 注意：此步骤必须由用户手动完成，Agent 绝对不能自动调用浏览器！

# 步骤 3: 使用授权码换取 API Key
lbp-growth-calendar auth verify <auth-code>
```

**⚠️ 安全警告**：步骤 2 的浏览器授权涉及用户登录和敏感操作，必须由用户本人在浏览器中手动完成。Agent/自动化脚本严禁尝试自动打开浏览器或模拟登录流程。

### 2. 验证配置

```bash
lbp-growth-calendar auth status
```

### 3. 使用环境变量（可选，适合 CI/CD）

```bash
export LBP_GROWTH_CALENDAR_TOKEN="your_token_here"
lbp-growth-calendar dau list --start-date 2026-07-01
```

## 命令一览

### 认证管理

```bash
# 发起授权流程，获取授权码
lbp-growth-calendar auth init

# 用授权码换取 Token
lbp-growth-calendar auth verify <auth-code>

# 查看当前 Token 配置状态
lbp-growth-calendar auth status

# 清除本地保存的 Token
lbp-growth-calendar auth clear
```

### DAU 数据查询

```bash
lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-31
```

### 事件管理

```bash
lbp-growth-calendar events list --start-date 2026-07-01 --end-date 2026-07-31
lbp-growth-calendar events list --event-type activation
lbp-growth-calendar events get <id>
lbp-growth-calendar events create --date 2026-07-15 --event-type activation \
  --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"
lbp-growth-calendar events update <id> --name "..." --expected-users 5.1
lbp-growth-calendar events delete <id>
```

### 数据订正

**AI Friendly 原子操作**（推荐）：CLI 自动拉取当日数据并合并，避免误删事件。

```bash
# 只订正 DAU / 额度 / 说明
lbp-growth-calendar correct-meta --date 2026-07-15 \
  --corrected-dau 35.0 --quota 12.5 --correction-note "新版本灰度放量"

# 只订正说明也可以
lbp-growth-calendar correct-meta --date 2026-07-15 --correction-note "确认正常波动"

# 单条事件增删改
lbp-growth-calendar correct-event add --date 2026-07-15 \
  --event-type activation --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"

lbp-growth-calendar correct-event update <event-id> --date 2026-07-15 \
  --expected-users 5.1

lbp-growth-calendar correct-event delete <event-id> --date 2026-07-15
```

**全量模式**（脚本使用）：直接传完整 events 列表，未列出的事件会被删除。

```bash
# 通过 JSON 字符串
lbp-growth-calendar correct --date 2026-07-15 \
  --corrected-dau 35.0 --quota 12.5 --correction-note "订正说明" \
  --events '[{"id":"e805...","eventType":"activation","name":"...","expectedUsers":4.2}]'

# 通过 JSON 文件
lbp-growth-calendar correct --date 2026-07-15 --events-file events.json
```

## Agent AI Friendly 规范说明

1. **机器可解析**：输出格式为 JSON，`ok` 字段标识成功/失败
2. **原子操作优先**：`correct-meta` 与 `correct-event` 让 AI 只关注单点改动，无需担心全量覆盖误删
3. **自描述性**：`--help` 提供详细的参数说明
4. **一致性**：所有命令使用统一的参数命名规范（`--start-date`, `--end-date`, `--event-type`, `--date`）
5. **幂等性**：GET 请求幂等；PUT/DELETE 操作基于 ID
6. **错误处理**：错误输出结构化 JSON 且进程退出码非 0
7. **无交互式提示**：所有参数通过命令行或环境变量传入

## 输出格式

### 成功

```json
{
  "ok": true,
  "data": ...
}
```

### 失败

```json
{
  "ok": false,
  "error": "NOT_FOUND",
  "message": "事件 xxx 不存在"
}
```

## 返回码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 请求失败 / 参数错误 / 资源不存在 / 认证失败 |

## 错误处理与技术支持

所有错误输出均为结构化 JSON，包含：
- `error`: 错误代码
- `title`: 错误标题
- `reason`: 错误原因
- `suggestion`: 解决建议（包含联系 jg/俊奇的方式）
- `quickFix`: 快速修复方法

### 常见错误

**缺少 Token**
```json
{
  "ok": false,
  "error": "MISSING_BEARER_TOKEN",
  "message": "Token 不能为空。请联系 jg（俊奇）获取 --token 参数。"
}
```

**认证失败（401/403）**
```json
{
  "ok": false,
  "error": "UNAUTHORIZED",
  "title": "认证失败",
  "reason": "Token 无效、已过期或未提供",
  "suggestion": [
    "1. 确认 Token 正确且未过期（请联系 jg（俊奇）获取）",
    "2. 确认 API Key 未过期（如过期需重新执行 verify）",
    "3. 确认 Token 有访问该接口的权限",
    "4. 如问题持续，请联系 jg（俊奇）技术支持"
  ]
}
```

**技术支持：jg（俊奇）**

所有错误消息都会包含联系人的信息。如果问题无法自行解决，请联系 **jg（俊奇）** 获取技术支持。

## License

MIT

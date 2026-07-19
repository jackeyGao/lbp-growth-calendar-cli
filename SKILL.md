---
name: lbp-growth-calendar
description: 增长日历 CLI：DAU 数据查询、增长事件管理、数据订正。Agent 通过命令行调用，非交互式，返回结构化 JSON。CLI 已内置 Bearer Token，无需申请。
metadata:
  version: 2.9.0
---

# 增长日历 CLI

> **使用场景**：需要查询增长日历数据、管理增长事件、或订正 DAU/额度数据时调用。
> **认证方式**：CLI 已内置 Bearer Token，Agent 只需协助用户完成浏览器授权即可。

## 什么时候调用本技能

当对话涉及以下任一主题时，应主动调用本 CLI：
- 查询 DAU（日活）、额度消耗、增长事件数据
- 创建/修改/删除增长事件（activation、recall、customer_service）
- 订正某日 DAU、额度或事件数据
- 用户说"增长日历"、"DAU"、"事件"、"订正"等关键词

## 前置要求

- Node.js 18+
- 已安装 CLI：`npm install -g lbp-growth-calendar`

## 认证流程（必须优先完成）

用户需要完成授权才能访问业务接口。Agent 应主动协助完成。

### 步骤 1：发起授权

```bash
lbp-growth-calendar auth init
```

成功返回：
```json
{
  "ok": true,
  "authCode": "a1b2c3d4...",
  "authUrl": "https://bytedance.aiforce.cloud/app/app_179t4b8e4mv/agent-auth?code=...",
  "instructions": [
    "步骤 1（已完成）: CLI 已获取授权码",
    "步骤 2: 【用户手动操作】在浏览器中访问上面的 authUrl，完成登录授权",
    "步骤 3: 在 CLI 中执行: lbp-growth-calendar auth verify <auth-code>"
  ]
}
```

> **Agent 操作**：向用户展示 `authUrl`，明确告知需**手动**在浏览器中完成授权，等待用户确认后再执行步骤 3。
> **严禁**：Agent 自动打开浏览器、模拟登录、或自动化任何认证流程。

### 步骤 2：换取 API Key

用户确认完成浏览器授权后：

```bash
lbp-growth-calendar auth verify <auth-code>
```

成功返回：
```json
{
  "ok": true,
  "message": "授权成功！API Key 已保存",
  "user": { "userId": "...", "userName": "..." },
  "expiresAt": "2026-07-18T10:30:00.000Z"
}
```

### 步骤 3：验证认证状态

```bash
lbp-growth-calendar auth status
```

若返回 `configured: true`，即可调用业务命令。

### 认证常见问题

| 问题 | 解决方案 |
|------|----------|
| `AUTH_PENDING` | 用户尚未完成浏览器授权，请用户访问 `authUrl` |
| `AUTH_EXPIRED` | 授权码过期，重新执行 `auth init` |
| `API_KEY_MISSING` / `NOT_CONFIGURED` | 执行完整的 init → verify 流程 |

## 命令参考

### DAU 数据查询

#### `dau list` — 查询每日 DAU 数据

```bash
lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-31
```

返回数组，每个元素包含：
- `date`：日期
- `quotaConsumption`：额度消耗（万）
- `activation`：当日激活总量（万）
- `recall`：当日召回总量（万）
- `isWorkday`：是否工作日
- `dataType`：`actual`=实际, `forecast`=预测
- `correctionNote`：订正说明
- `correctedDau` / `correctedQuota`：订正后数据
- `events`：当日事件列表
- `correctionRecords`：订正变更记录

**适用场景**：用户想查看某段时间的 DAU 趋势、事件分布、订正历史。

### 事件管理

#### `events list` — 查询事件列表

```bash
lbp-growth-calendar events list --start-date 2026-07-01 --end-date 2026-07-31
lbp-growth-calendar events list --start-date 2026-07-01 --end-date 2026-07-31 --event-type activation
```

#### `events get <id>` — 获取单个事件详情

```bash
lbp-growth-calendar events get e805f39d-a380-4244-a8c5-aae58ebc63a3
```

#### `events create` — 创建事件

```bash
lbp-growth-calendar events create \
  --date 2026-07-15 \
  --event-type activation \
  --name "渠道投放-抖音" \
  --expected-users 4.2 \
  --tags "渠道&SMB"
```

#### `events update <id>` — 更新事件（支持日期变更）

```bash
# 仅修改名称
lbp-growth-calendar events update <id> --name "渠道投放-快手"

# 变更日期
lbp-growth-calendar events update <id> --date 2026-07-20

# 同时变更多个字段
lbp-growth-calendar events update <id> \
  --date 2026-07-20 \
  --name "渠道投放-快手" \
  --expected-users 5.1
```

#### `events delete <id>` — 删除事件

```bash
lbp-growth-calendar events delete e805f39d-a380-4244-a8c5-aae58ebc63a3
```

### 数据订正

#### `correct-meta` — 原子操作：只改 DAU/额度/说明

不修改事件，自动保留原有事件列表。

```bash
lbp-growth-calendar correct-meta --date 2026-07-15 \
  --corrected-dau 35.0 \
  --quota 12.5 \
  --correction-note "新版本灰度放量"
```

#### `correct-event` — 原子操作：单条事件增删改

内部自动拉取当日现状并合并，避免误删其他事件。

```bash
# 新增事件
lbp-growth-calendar correct-event add --date 2026-07-15 \
  --event-type activation \
  --name "渠道投放-抖音" \
  --expected-users 4.2 \
  --tags "渠道&SMB"

# 更新事件
lbp-growth-calendar correct-event update <id> --date 2026-07-15 \
  --expected-users 5.1

# 删除事件
lbp-growth-calendar correct-event delete <id> --date 2026-07-15
```

#### `correct` — 全量订正（高级模式）

直接传完整 events 列表，未列出的事件将被删除。适合脚本批处理。

```bash
lbp-growth-calendar correct --date 2026-07-15 \
  --corrected-dau 35.0 --quota 12.5 \
  --events-file events.json
```

## Agent 使用示例

### 完整对话示例

**用户**：帮我查一下 7 月 1 日到 15 日的 DAU 数据，顺便看看有什么事件。

**Agent**：
```bash
# 先确保用户已完成授权
lbp-growth-calendar auth status
```

若未授权，引导用户执行 init → verify 流程。

授权完成后：
```bash
# 查询 DAU 数据
lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-15

# 查询事件列表
lbp-growth-calendar events list --start-date 2026-07-01 --end-date 2026-07-15
```

**用户**：7 月 10 号那天有个事件影响用户数写错了，应该是 3.5 万不是 2.0 万。

**Agent**：
```bash
# 先找到事件 ID（从上一步结果中获取）
lbp-growth-calendar events list --start-date 2026-07-10 --end-date 2026-07-10

# 更新事件
lbp-growth-calendar events update <event-id> --expected-users 3.5
```

**用户**：帮我把"渠道投放-抖音"这个事件从 7 月 10 号改到 7 月 12 号。

**Agent**：
```bash
lbp-growth-calendar events update <event-id> --date 2026-07-12
```

## 输出格式

### 成功

```json
{
  "ok": true,
  "data": { ... }
}
```

### 失败

```json
{
  "ok": false,
  "error": "ERROR_CODE",
  "message": "错误描述"
}
```

## 返回码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 请求失败 / 参数错误 / 资源不存在 / 授权失败 |

## 更多信息

- 仓库: https://github.com/jackeyGao/lbp-growth-cli
- 问题反馈: https://github.com/jackeyGao/lbp-growth-cli/issues

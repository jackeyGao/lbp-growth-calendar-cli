---
name: lbp-growth-calendar
description: 增长日历 CLI：DAU 数据查询、增长事件管理、数据订正 - 完全非交互式，AI/Agent 友好，支持自主授权流程
metadata:
  author: LBP Growth Team
  version: 2.0.0
  tags:
    - lbp
    - growth
    - calendar
    - dau
    - events
    - correct
    - ai-friendly
    - agent-ready
    - oauth
    - self-service-auth
---

# 增长日历 CLI Agent

增长日历系统的 CLI 技能，支持：
- **自主授权流程**：`init` -> 浏览器授权 -> `verify`，无需人工申请 Token
- 按日期范围查询每日 DAU 数据（含事件与订正变更记录）
- 增长事件的增删改查
- **数据订正**（DAU/额度/事件全量订正），提供 AI Friendly 原子操作与全量高级模式

## 前置要求

- Node.js 18+

## 安装

```bash
npm install -g lbp-growth-calendar
```

## 授权流程（获取 Token）

CLI 支持完整的 OAuth 风格授权流程，无需联系管理员申请 Token。

### 步骤 1：发起授权

```bash
lbp-growth-calendar auth init
```

输出示例：
```json
{
  "ok": true,
  "message": "授权流程已发起",
  "authCode": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "authUrl": "https://bytedance.aiforce.cloud/app/app_179t4b8e4mv/agent-auth?code=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "instructions": [
    "1. 在浏览器中访问上面的 authUrl",
    "2. 完成登录授权",
    "3. 执行: lbp-growth-calendar auth verify a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
  ]
}
```

### 步骤 2：浏览器授权

在浏览器中访问 `authUrl`，完成登录授权。

### 步骤 3：换取 Token

```bash
lbp-growth-calendar auth verify <auth-code>
```

输出示例：
```json
{
  "ok": true,
  "message": "授权成功，Token 已保存",
  "user": {
    "userId": "1847292357012580",
    "userName": "张伟"
  },
  "expiresAt": "2026-07-18T10:30:00.000Z",
  "configFile": "/Users/username/.lbp-growth-calendar/config.json"
}
```

### 验证配置

```bash
lbp-growth-calendar auth status
```

## 配置 Token（任选其一）

### 方式一：环境变量（推荐用于 CI/CD）

```bash
export LBP_GROWTH_CALENDAR_TOKEN="your_token_here"
```

### 方式二：本地配置文件（推荐用于本地开发）

通过上面的 `auth init` 和 `auth verify` 流程自动保存。

### 方式三：命令行参数

```bash
lbp-growth-calendar --token <your-token> dau list --start-date 2026-07-01
```

## 使用示例

### 查询 DAU 数据

```bash
lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-31
```

### 事件管理

```bash
# 查询事件列表
lbp-growth-calendar events list --start-date 2026-07-01 --end-date 2026-07-31
lbp-growth-calendar events list --event-type activation

# 获取 / 创建 / 更新 / 删除
lbp-growth-calendar events get <event-id>
lbp-growth-calendar events create --date 2026-07-15 --event-type activation \
  --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"
lbp-growth-calendar events update <event-id> --name "渠道投放-快手" --expected-users 5.1
lbp-growth-calendar events delete <event-id>
```

### 数据订正（推荐 AI Friendly 原子操作）

订正接口 `POST /openapi/dau/correct` 是 **全量覆盖** 语义（未列出事件会被删除）。为便于 AI 与人工使用，CLI 提供两种模式：

#### 模式 1：AI Friendly 原子操作（推荐）

CLI 自动拉取当日现状并合并本次改动，避免误删事件。

```bash
# 只订正 DAU / 额度 / 说明（事件保持不变）
lbp-growth-calendar correct-meta --date 2026-07-15 \
  --corrected-dau 35.0 \
  --quota 12.5 \
  --correction-note "新版本灰度放量"

# 只改其中一项也可以：只订正说明
lbp-growth-calendar correct-meta --date 2026-07-15 --correction-note "确认为正常波动"

# 新增一条订正事件（其它事件与 meta 不变）
lbp-growth-calendar correct-event add --date 2026-07-15 \
  --event-type activation \
  --name "渠道投放-抖音" \
  --expected-users 4.2 \
  --tags "渠道&SMB"

# 更新指定事件的字段
lbp-growth-calendar correct-event update e805f39d-a380-4244-a8c5-aae58ebc63a3 \
  --date 2026-07-15 \
  --expected-users 5.1

# 删除指定事件
lbp-growth-calendar correct-event delete e805f39d-a380-4244-a8c5-aae58ebc63a3 \
  --date 2026-07-15
```

**原子操作内部流程**：
1. CLI 先 GET `/openapi/dau?startDate=<date>&endDate=<date>` 拉取当日数据
2. 过滤掉虚拟循环事件（`isRecurring=true`）
3. 合并本次改动：`meta` 未指定则沿用原值，事件按 `add/update/delete` 操作合并
4. 全量提交 POST `/openapi/dau/correct`

#### 模式 2：全量订正（高级/脚本使用）

直接传完整 events 列表，未列出的事件会被删除。适合脚本批处理。

```bash
# 通过 --events JSON 字符串
lbp-growth-calendar correct --date 2026-07-15 \
  --corrected-dau 35.0 --quota 12.5 --correction-note "订正说明" \
  --events '[{"id":"e805...","eventType":"activation","name":"渠道投放-抖音","expectedUsers":4.2,"tags":["渠道&SMB"]},{"eventType":"recall","name":"新召回事件","expectedUsers":1.0}]'

# 通过 --events-file JSON 文件
lbp-growth-calendar correct --date 2026-07-15 \
  --corrected-dau 35.0 --quota 12.5 \
  --events-file events.json
```

`events.json` 示例：
```json
[
  { "id": "e805f39d-...", "eventType": "activation", "name": "渠道投放-抖音", "expectedUsers": 4.2, "tags": ["渠道&SMB"] },
  { "eventType": "recall", "name": "新召回事件", "expectedUsers": 1.0 }
]
```

事件对象说明：
- `id` 可选：**传则更新，不传则新增**
- 未在列表中出现的事件将被删除
- `eventType` / `name` / `expectedUsers` 必填
- `tags` 可选

## 命令参考

### Auth 命令（认证管理）

| 命令 | 说明 | AI/Agent 友好 |
|------|------|---------------|
| `auth init` | 发起授权流程，获取授权码和授权链接 | ✅ 非交互式 |
| `auth verify <code>` | 用授权码换取 Token 并保存 | ✅ 非交互式 |
| `auth status` | 查看当前 Token 配置状态 | ✅ 输出结构化 JSON |
| `auth clear` | 清除本地保存的 Token | ✅ 非交互式 |

### DAU 命令

| 命令 | 说明 |
|------|------|
| `dau list [--start-date] [--end-date]` | 按日期范围查询每日 DAU 数据 |

### Events 命令

| 命令 | 说明 |
|------|------|
| `events list [--start-date] [--end-date] [--event-type]` | 查询事件列表 |
| `events get <id>` | 获取单个事件详情 |
| `events create --date --event-type --name --expected-users [--tags]` | 新增事件 |
| `events update <id> [--name] [--expected-users] [--tags]` | 更新事件 |
| `events delete <id>` | 删除事件 |

### 订正命令

| 命令 | 模式 | 说明 |
|------|------|------|
| `correct-meta --date [--corrected-dau] [--quota] [--correction-note]` | 原子 | 只改 DAU/额度/说明，事件保持不变 |
| `correct-event add --date --event-type --name --expected-users [--tags] [--correction-note]` | 原子 | 新增一条订正事件 |
| `correct-event update <id> --date [--event-type] [--name] [--expected-users] [--tags] [--correction-note]` | 原子 | 更新指定事件 |
| `correct-event delete <id> --date [--correction-note]` | 原子 | 删除指定事件 |
| `correct --date [--corrected-dau] [--quota] [--correction-note] (--events \| --events-file)` | 全量 | 直接传完整 events 列表 |

### 全局选项

| 选项 | 说明 |
|------|------|
| `--token <token>` | Bearer Token（可用 `LBP_GROWTH_CALENDAR_TOKEN` 环境变量，优先级高于配置文件） |

> **注意**：API 基础地址已内置，无需配置。如需覆盖，可设置 `LBP_GROWTH_CALENDAR_BASE_URL` 环境变量。

## Agent 使用示例

```javascript
const { execSync } = require('child_process');

// ========== 自主授权流程 ==========
// 步骤 1: 发起授权
const initRes = JSON.parse(execSync('lbp-growth-calendar auth init', { encoding: 'utf8' }));
console.log('请在浏览器中访问:', initRes.authUrl);

// 步骤 2: 等待用户在浏览器中完成授权（这里需要人工介入或自动化浏览器操作）

// 步骤 3: 用授权码换取 Token
const verifyRes = JSON.parse(execSync(`lbp-growth-calendar auth verify ${initRes.authCode}`, { encoding: 'utf8' }));
if (verifyRes.ok) {
  console.log('授权成功，用户:', verifyRes.user.userName);
}

// ========== 或使用环境变量（适合 CI/CD）==========
process.env.LBP_GROWTH_CALENDAR_TOKEN = 'your_token_here';

// 验证 Token 配置
const status = JSON.parse(execSync('lbp-growth-calendar auth status', { encoding: 'utf8' }));
console.log('Token 配置状态:', status.configured);

// ========== DAU 查询 ==========
const dauData = JSON.parse(execSync(
  'lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-31',
  { encoding: 'utf8' }
));
if (dauData.ok) console.log('DAU 数据:', dauData.data);

// ========== 事件管理 ==========
// 创建事件
const createRes = JSON.parse(execSync(
  'lbp-growth-calendar events create --date 2026-07-15 ' +
  '--event-type activation --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"',
  { encoding: 'utf8' }
));
if (createRes.ok) console.log('创建成功:', createRes.data);

// ========== 数据订正 ==========
// 1. 只订正当日说明（不动 DAU/额度/事件）
execSync('lbp-growth-calendar correct-meta --date 2026-07-15 --correction-note "确认正常波动"');

// 2. 新增一条订正事件（不动 meta 和其它事件）
const addRes = JSON.parse(execSync(
  'lbp-growth-calendar correct-event add --date 2026-07-15 ' +
  '--event-type activation --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"',
  { encoding: 'utf8' }
));
if (addRes.ok) console.log('订正成功:', addRes.data);

// 3. 脚本批量订正：全量传 events 列表
execSync('lbp-growth-calendar correct --date 2026-07-15 --events-file ./events.json --corrected-dau 35.0');
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
  "error": "NOT_FOUND | INVALID_ARGS | REQUEST_FAILED | API_ERROR | AUTH_PENDING | AUTH_EXPIRED",
  "message": "错误描述"
}
```

## 返回码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 请求失败 / 参数错误 / 资源不存在 / 授权失败 |

## 数据字段说明

### DAU 数据字段

| 字段 | 类型 | 说明 |
|------|------|------|
| date | string | 日期 YYYY-MM-DD |
| quotaConsumption | number | 额度消耗（万） |
| activation | number | 当日激活总量（万） |
| recall | number | 当日召回总量（万） |
| isWorkday | boolean | 是否工作日 |
| dataType | string | actual=实际, forecast=预测 |
| correctionNote | string? | 订正说明 |
| correctedDau | number? | 订正后 DAU（万） |
| correctedQuota | number? | 订正后额度消耗（万） |
| forecastDau | number? | 预测 DAU（万） |
| forecastQuota | number? | 预测额度消耗（万） |
| events | array | 当日事件列表（含虚拟循环事件） |
| correctionRecords | array | 当日订正变更记录 |

### 事件字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 事件 UUID（循环事件为 recurring_<ruleId>_<date>） |
| date | string | 事件日期 |
| eventType | string | activation=激活, recall=召回 |
| name | string | 事件名称 |
| expectedUsers | number | 预计影响用户数（万） |
| tags | string[]? | 分类标签 |
| isRecurring | boolean? | 是否循环虚拟事件（订正模式下会被过滤） |
| forecastExpectedUsers | number? | 订正前预测用户数（万） |

## AI/Agent 友好设计原则

本 CLI 专为 AI Agent 和自动化脚本设计，遵循以下原则：

### 1. 完全非交互式
- 所有命令不等待用户输入
- 所有参数通过命令行参数或环境变量传入
- 缺失必需参数时立即返回错误，不会卡住等待

### 2. 结构化输出
- 所有输出为 JSON 格式
- 统一结构：`{ ok: boolean, data?: any, error?: string, message?: string }`
- 成功时返回码 0，失败时返回码非 0

### 3. 自主授权流程
- 支持完整的 OAuth 风格授权流程
- `init` 获取授权码和链接
- `verify` 换取 Token
- 无需人工联系管理员申请 Token

### 4. 幂等设计
- GET 查询操作天然幂等
- 修改操作基于 ID，可重复执行
- 原子操作自动合并数据，避免误删

### 5. 错误处理
- 错误返回结构化 JSON
- 包含错误代码和可读消息
- 进程退出码明确区分成功/失败

### 6. 灵活的认证方式
- 自主授权流程（适合首次使用）
- 环境变量（适合 CI/CD）
- 配置文件（适合本地开发）
- 命令行参数（适合临时调用）

## 更多信息

- 仓库: https://github.com/jackeyGao/lbp-growth-cli
- 问题反馈: https://github.com/jackeyGao/lbp-growth-cli/issues

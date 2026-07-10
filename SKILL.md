---
name: lbp-growth-calendar
description: 增长日历 CLI：DAU 数据查询、增长事件管理、数据订正
metadata:
  author: LBP Growth Team
  version: 1.1.0
  tags:
    - lbp
    - growth
    - calendar
    - dau
    - events
    - correct
---

# 增长日历 CLI Agent

增长日历系统的 CLI 技能，支持：
- 按日期范围查询每日 DAU 数据（含事件与订正变更记录）
- 增长事件的增删改查
- **数据订正**（DAU/额度/事件全量订正），提供 AI Friendly 原子操作与全量高级模式

## 前置要求

- Node.js 18+
- Bearer Token（联系管理员获取）

## 安装

```bash
npm install -g lbp-growth-calendar
```

## 配置凭据

```bash
export LBP_GROWTH_CALENDAR_BASE_URL="https://your-api-host.com"
export LBP_GROWTH_CALENDAR_TOKEN="your_bearer_token_here"
```

或命令行参数：`--base-url` / `--token`。

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

### 订正命令（新）

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
| `--base-url <url>` | API 基础地址（可用 `LBP_GROWTH_CALENDAR_BASE_URL` 环境变量） |
| `--token <token>` | Bearer Token（可用 `LBP_GROWTH_CALENDAR_TOKEN` 环境变量） |

## Agent 使用示例

```javascript
const { execSync } = require('child_process');

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
  "error": "NOT_FOUND | INVALID_ARGS | REQUEST_FAILED | API_ERROR",
  "message": "错误描述"
}
```

## 返回码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 请求失败 / 参数错误 / 资源不存在 |

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

## 更多信息

- 仓库: https://github.com/jackeyGao/lbp-growth-cli
- 问题反馈: https://github.com/jackeyGao/lbp-growth-cli/issues

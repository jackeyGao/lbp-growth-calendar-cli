# lbp-growth-calendar

增长日历 CLI 工具 —— Agent AI Friendly 规范

## 特性

- **结构化 JSON 输出**：所有命令默认输出 `{ "ok": true, "data": ... }` 结构，方便 AI Agent 和程序化调用
- **清晰的命令层次**：`auth`（认证）、`dau`（查询）、`events`（增删改查）、`correct-meta`/`correct-event`/`correct`（订正）、`penetration`（AI 渗透率）
- **AI Friendly 原子操作**：订正接口是全量覆盖语义，CLI 提供 `correct-meta` 与 `correct-event add|update|delete` 自动合并当日数据，避免误删
- **全量高级模式**：`correct` 命令支持直接传完整 events 列表或 JSON 文件，适合脚本批处理
- **一致的错误结构**：错误输出 `{ "ok": false, "error": "CODE", "message": "..." }` 且退出码非 0
- **无交互式设计**：所有命令完全非交互式，所有参数通过 CLI 参数或环境变量传入，适合自动化脚本和 AI Agent 调用

## 安装

```bash
npm install -g lbp-growth-calendar
```

## 配置 Token（任选其一）

API 基础地址已内置，无需配置。只需提供 Bearer Token 即可使用。

### 方式一：环境变量（推荐用于 CI/CD）

```bash
export LBP_GROWTH_CALENDAR_TOKEN="your_bearer_token_here"
```

### 方式二：本地配置文件（推荐用于本地开发）

```bash
# 保存 Token 到本地配置文件
lbp-growth-calendar auth save <your-token>

# 验证配置
lbp-growth-calendar auth status
```

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

### AI 渗透率数据

```bash
# 查询
lbp-growth-calendar penetration list --start-date 2026-07-01 --end-date 2026-07-31

# 新增
lbp-growth-calendar penetration create \
  --type free \
  --date 2026-07-15 \
  --tenant-type paid_conversion \
  --feishu-dau 120.5 \
  --activated-users 8.6

# 幂等写入
lbp-growth-calendar penetration upsert \
  --type paid \
  --date 2026-07-15 \
  --customer-industry retail \
  --arr 100000 \
  --smart-partner-dau 3.6
```

## 命令参考

### Auth 命令（认证管理）

| 命令 | 说明 | AI/Agent 友好 |
|------|------|---------------|
| `auth save <token>` | 保存 Token 到本地配置文件 | ✅ 非交互式，参数直接传入 |
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

### Penetration 命令

| 命令 | 说明 |
|------|------|
| `penetration list [--start-date] [--end-date]` | 查询 AI 渗透率数据 |
| `penetration create ...` | 新增 AI 渗透率数据 |
| `penetration upsert ...` | 按幂等键更新或插入 AI 渗透率数据 |

### 全局选项

| 选项 | 说明 |
|------|------|
| `--token <token>` | 本次命令使用的 Bearer Token（优先级高于环境变量和配置文件） |

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

## Agent 使用示例

```javascript
const { execSync } = require('child_process');

process.env.LBP_GROWTH_CALENDAR_TOKEN = 'your_token_here';

const status = JSON.parse(execSync('lbp-growth-calendar auth status', { encoding: 'utf8' }));
console.log('Token 配置状态:', status.configured);

const dauData = JSON.parse(execSync(
  'lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-31',
  { encoding: 'utf8' }
));
if (dauData.ok) console.log('DAU 数据:', dauData.data);

const createRes = JSON.parse(execSync(
  'lbp-growth-calendar events create --date 2026-07-15 ' +
  '--event-type activation --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"',
  { encoding: 'utf8' }
));
if (createRes.ok) console.log('创建成功:', createRes.data);

execSync('lbp-growth-calendar correct-meta --date 2026-07-15 --correction-note "确认正常波动"');
```

## License

MIT

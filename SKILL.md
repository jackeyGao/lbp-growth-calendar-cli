---
name: lbp-growth-calendar
description: 增长日历 CLI：DAU 数据查询、增长事件管理、数据订正、AI 渗透率数据写入；适用于需要通过非交互式命令批量查询或修改增长日历数据的场景。
metadata:
  version: 2.6.0
---

# 增长日历 CLI

支持：
- **自主授权流程**：`init` -> 浏览器授权 -> `verify`，无需人工申请 Token
- 按日期范围查询每日 DAU 数据
- 增长事件增删改查
- 数据订正（原子模式与全量模式）
- AI 渗透率数据查询与写入

## 前置要求

- Node.js 18+

## 授权流程（推荐）

CLI 使用内置 Bearer Token + 用户 API Key 的双层认证机制。

### 步骤 1：发起授权

```bash
lbp-growth-calendar auth init
```

输出示例：
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

### 步骤 2：浏览器授权（⚠️ 必须由用户手动完成）

**🚨 重要安全警告：此步骤必须由用户手动在浏览器中完成，Agent 绝对不能自动调用浏览器或尝试自动化登录授权流程。**

用户需要在浏览器中访问 `authUrl`，完成登录和授权。Agent 应该：
1. 向用户显示 `authUrl` 链接
2. 明确告知用户需要手动访问该链接
3. 等待用户完成授权后，再执行步骤 3 的 verify 命令

### 步骤 3：换取 API Key

```bash
lbp-growth-calendar auth verify <auth-code>
```

输出示例：
```json
{
  "ok": true,
  "message": "授权成功！API Key 已保存",
  "user": {
    "userId": "1847292357012580",
    "userName": "张伟"
  },
  "expiresAt": "2026-07-18T10:30:00.000Z"
}
```

### 验证配置

```bash
lbp-growth-calendar auth status
```

### 清除认证

```bash
lbp-growth-calendar auth clear
```

## 备选认证方式（高级用户）

如果已有 Bearer Token，可直接使用：

```bash
# 方式 1：环境变量
export LBP_GROWTH_CALENDAR_TOKEN="your_bearer_token_here"

# 方式 2：保存到配置文件
lbp-growth-calendar auth save <your-token>

# 方式 3：本次命令追加 --token
lbp-growth-calendar --token <your-token> dau list --start-date 2026-07-01
```

## 常用命令

### DAU 查询

```bash
lbp-growth-calendar dau list --start-date 2026-07-01 --end-date 2026-07-31
```

### 事件管理

```bash
lbp-growth-calendar events list --start-date 2026-07-01 --end-date 2026-07-31
lbp-growth-calendar events get <event-id>
lbp-growth-calendar events create --date 2026-07-15 --event-type activation --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"
lbp-growth-calendar events update <event-id> --name "渠道投放-快手" --expected-users 5.1
lbp-growth-calendar events delete <event-id>
```

### 数据订正

```bash
lbp-growth-calendar correct-meta --date 2026-07-15 --corrected-dau 35.0 --quota 12.5 --correction-note "新版本灰度放量"
```

```bash
lbp-growth-calendar correct-event add --date 2026-07-15 --event-type activation --name "渠道投放-抖音" --expected-users 4.2 --tags "渠道&SMB"
```

```bash
lbp-growth-calendar correct --date 2026-07-15 --events-file events.json
```

### AI 渗透率

```bash
# 查询列表（支持按 AI 付费状态过滤）
lbp-growth-calendar penetration list --start-date 2026-07-01 --end-date 2026-07-31 --ai-payment-status paid

# 幂等更新或插入（唯一写入接口，无记录则创建，有则更新）
# free 类型幂等键: dataDate + type + tenantType + aiPaymentStatus
# paid 类型幂等键: dataDate + type + customerIndustry + aiPaymentStatus
lbp-growth-calendar penetration upsert --type paid --date 2026-07-15 --customer-industry retail --ai-payment-status paid --arr 100000
```

## 命令参考

### Auth 命令（认证管理）

| 命令 | 说明 |
|------|------|
| `auth init` | 发起用户授权流程，获取授权码和链接 |
| `auth verify <code>` | 用授权码换取 API Key |
| `auth status` | 查看当前认证配置状态 |
| `auth clear` | 清除本地保存的所有认证信息 |
| `auth save <token>` | 直接保存 Bearer Token（高级用户） |

### DAU 命令

| 命令 | 说明 |
|------|------|
| `dau list [--start-date] [--end-date]` | 按日期范围查询每日 DAU 数据 |

### Events 命令

| 命令 | 说明 |
|------|------|
| `events list` | 查询事件列表 |
| `events get <id>` | 获取单个事件详情 |
| `events create` | 新增事件 |
| `events update <id>` | 更新事件 |
| `events delete <id>` | 删除事件 |

### Penetration 命令（AI 渗透率）

| 命令 | 说明 |
|------|------|
| `penetration list` | 查询 AI 渗透数据列表 |
| `penetration upsert` | 幂等更新或插入 |

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

## 更多信息

- 仓库: https://github.com/jackeyGao/lbp-growth-cli
- 问题反馈: https://github.com/jackeyGao/lbp-growth-cli/issues

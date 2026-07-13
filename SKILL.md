---
name: lbp-growth-calendar
description: 增长日历 CLI：DAU 数据查询、增长事件管理、数据订正、AI 渗透率数据写入；适用于需要通过非交互式命令批量查询或修改增长日历数据的场景。
---

# 增长日历 CLI

支持：
- 按日期范围查询每日 DAU 数据
- 增长事件增删改查
- 数据订正（原子模式与全量模式）
- AI 渗透率数据查询与写入

## 前置要求

- Node.js 18+
- Bearer Token

## 认证方式

任选其一：

```bash
export LBP_GROWTH_CALENDAR_TOKEN="your_bearer_token_here"
```

```bash
lbp-growth-calendar auth save <your-token>
lbp-growth-calendar auth status
```

```bash
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

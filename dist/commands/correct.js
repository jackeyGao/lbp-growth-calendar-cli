"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCorrectCommand = registerCorrectCommand;
const fs = __importStar(require("fs"));
const http_1 = require("../utils/http");
/**
 * 拉取指定日期当日 DAU 数据（含事件与订正 meta）
 */
async function fetchDayData(date, reqOpts) {
    const query = `?startDate=${date}&endDate=${date}`;
    const { status, data } = await (0, http_1.apiRequest)('GET', `/openapi/dau${query}`, reqOpts);
    if (status !== 200) {
        throw new Error(`获取当日数据失败: HTTP ${status}: ${JSON.stringify(data)}`);
    }
    const arr = data;
    if (!Array.isArray(arr) || arr.length === 0)
        return null;
    return arr.find((d) => d.date === date) || arr[0];
}
/**
 * 将 GET /openapi/dau 返回的事件转换为 POST /openapi/dau/correct 需要的事件格式
 * 过滤掉虚拟循环事件（isRecurring=true，ID 形如 recurring_xxx），只保留物化事件
 */
function toCorrectEvents(dayEvents) {
    return dayEvents
        .filter((e) => !e.isRecurring && !String(e.id).startsWith('recurring_'))
        .map((e) => ({
        id: e.id,
        eventType: e.eventType,
        name: e.name,
        expectedUsers: e.expectedUsers,
        ...(e.tags ? { tags: e.tags } : {}),
    }));
}
/**
 * 组装并提交订正请求
 */
async function submitCorrect(reqOpts, payload) {
    return (0, http_1.apiRequest)('POST', '/openapi/dau/correct', reqOpts, payload);
}
function parseNumberOpt(value) {
    if (value === undefined)
        return undefined;
    const n = parseFloat(value);
    if (Number.isNaN(n)) {
        throw new Error(`无效数字: ${value}`);
    }
    return n;
}
function parseTagsOpt(value) {
    if (value === undefined)
        return undefined;
    if (value === '')
        return [];
    return value.split(',').map((t) => t.trim()).filter(Boolean);
}
function registerCorrectCommand(program) {
    // ============================================================
    // correct-meta: 仅订正 DAU/额度/说明，事件保持不变
    // ============================================================
    program
        .command('correct-meta')
        .description('订正某日的 DAU/额度/说明（保留原有事件）\nAI Friendly 原子操作：CLI 自动拉取当日事件后合并提交')
        .requiredOption('--date <date>', '要订正的日期，YYYY-MM-DD')
        .option('--corrected-dau <number>', '订正后 DAU（万）；不传则保持原值/不订正')
        .option('--quota <number>', '订正后额度消耗（万）；不传则保持原值/不订正')
        .option('--correction-note <text>', '订正说明；不传则保持原说明')
        .action(async (opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const day = await fetchDayData(opts.date, reqOpts);
            if (!day) {
                (0, http_1.outputError)(`未找到日期 ${opts.date} 的数据`, 'NOT_FOUND');
            }
            const correctedDauInput = parseNumberOpt(opts.correctedDau);
            const quotaInput = parseNumberOpt(opts.quota);
            const payload = {
                date: opts.date,
                correctedDau: correctedDauInput !== undefined ? correctedDauInput : day.correctedDau,
                quota: quotaInput !== undefined ? quotaInput : day.correctedQuota,
                correctionNote: opts.correctionNote !== undefined ? opts.correctionNote : day.correctionNote,
                events: toCorrectEvents(day.events),
            };
            const { status, data } = await submitCorrect(reqOpts, payload);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    // ============================================================
    // correct-event: 单条事件原子增删改
    // ============================================================
    const correctEvent = program
        .command('correct-event')
        .description('订正模式下的单条事件增删改（AI Friendly 原子操作）\nCLI 内部自动拉取当日事件、合并后全量提交');
    // ---- add ----
    correctEvent
        .command('add')
        .description('新增一条订正事件（保留当日其它事件与 meta 不变）')
        .requiredOption('--date <date>', '事件日期，YYYY-MM-DD')
        .requiredOption('--event-type <type>', '事件类型: activation | recall')
        .requiredOption('--name <name>', '事件名称')
        .requiredOption('--expected-users <number>', '预计影响用户数（万）')
        .option('--tags <tags>', '分类标签，逗号分隔')
        .option('--correction-note <text>', '本次订正说明（可选，不传则保持原说明）')
        .action(async (opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const day = await fetchDayData(opts.date, reqOpts);
            if (!day) {
                (0, http_1.outputError)(`未找到日期 ${opts.date} 的数据`, 'NOT_FOUND');
            }
            const events = toCorrectEvents(day.events);
            const newEvent = {
                eventType: opts.eventType,
                name: opts.name,
                expectedUsers: parseFloat(opts.expectedUsers),
            };
            const tags = parseTagsOpt(opts.tags);
            if (tags !== undefined)
                newEvent.tags = tags;
            events.push(newEvent);
            const payload = {
                date: opts.date,
                correctedDau: day.correctedDau,
                quota: day.correctedQuota,
                correctionNote: opts.correctionNote !== undefined ? opts.correctionNote : day.correctionNote,
                events,
            };
            const { status, data } = await submitCorrect(reqOpts, payload);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    // ---- update ----
    correctEvent
        .command('update <id>')
        .description('更新一条订正事件（保留当日其它事件与 meta 不变）')
        .requiredOption('--date <date>', '事件日期，YYYY-MM-DD')
        .option('--event-type <type>', '事件类型: activation | recall')
        .option('--name <name>', '事件名称')
        .option('--expected-users <number>', '预计影响用户数（万）')
        .option('--tags <tags>', '分类标签，逗号分隔')
        .option('--correction-note <text>', '本次订正说明（可选）')
        .action(async (id, opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const day = await fetchDayData(opts.date, reqOpts);
            if (!day) {
                (0, http_1.outputError)(`未找到日期 ${opts.date} 的数据`, 'NOT_FOUND');
            }
            const events = toCorrectEvents(day.events);
            const target = events.find((e) => e.id === id);
            if (!target) {
                (0, http_1.outputError)(`日期 ${opts.date} 未找到事件 ${id}`, 'NOT_FOUND');
            }
            if (opts.eventType !== undefined)
                target.eventType = opts.eventType;
            if (opts.name !== undefined)
                target.name = opts.name;
            if (opts.expectedUsers !== undefined)
                target.expectedUsers = parseFloat(opts.expectedUsers);
            const tags = parseTagsOpt(opts.tags);
            if (tags !== undefined)
                target.tags = tags;
            const payload = {
                date: opts.date,
                correctedDau: day.correctedDau,
                quota: day.correctedQuota,
                correctionNote: opts.correctionNote !== undefined ? opts.correctionNote : day.correctionNote,
                events,
            };
            const { status, data } = await submitCorrect(reqOpts, payload);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    // ---- delete ----
    correctEvent
        .command('delete <id>')
        .description('删除一条订正事件（保留当日其它事件与 meta 不变）')
        .requiredOption('--date <date>', '事件日期，YYYY-MM-DD')
        .option('--correction-note <text>', '本次订正说明（可选）')
        .action(async (id, opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const day = await fetchDayData(opts.date, reqOpts);
            if (!day) {
                (0, http_1.outputError)(`未找到日期 ${opts.date} 的数据`, 'NOT_FOUND');
            }
            const events = toCorrectEvents(day.events);
            const before = events.length;
            const kept = events.filter((e) => e.id !== id);
            if (kept.length === before) {
                (0, http_1.outputError)(`日期 ${opts.date} 未找到事件 ${id}`, 'NOT_FOUND');
            }
            const payload = {
                date: opts.date,
                correctedDau: day.correctedDau,
                quota: day.correctedQuota,
                correctionNote: opts.correctionNote !== undefined ? opts.correctionNote : day.correctionNote,
                events: kept,
            };
            const { status, data } = await submitCorrect(reqOpts, payload);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    // ============================================================
    // correct: 全量订正（高级模式，脚本使用）
    // ============================================================
    program
        .command('correct')
        .description('全量订正某日数据（高级模式）\n直接传完整 events 列表；未列出的事件将被删除')
        .requiredOption('--date <date>', '要订正的日期，YYYY-MM-DD')
        .option('--corrected-dau <number>', '订正后 DAU（万）；不传视为 null（不订正）')
        .option('--quota <number>', '订正后额度消耗（万）；不传视为 null（不订正）')
        .option('--correction-note <text>', '订正说明；不传视为 null')
        .option('--events <json>', '事件列表 JSON 字符串（与 --events-file 二选一）')
        .option('--events-file <path>', '事件列表 JSON 文件路径（与 --events 二选一）')
        .action(async (opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            let events = [];
            if (opts.events && opts.eventsFile) {
                (0, http_1.outputError)('--events 与 --events-file 不能同时使用', 'INVALID_ARGS');
            }
            if (opts.events) {
                try {
                    events = JSON.parse(opts.events);
                }
                catch (e) {
                    (0, http_1.outputError)(`--events 不是合法 JSON: ${e.message}`, 'INVALID_ARGS');
                }
            }
            else if (opts.eventsFile) {
                if (!fs.existsSync(opts.eventsFile)) {
                    (0, http_1.outputError)(`--events-file 路径不存在: ${opts.eventsFile}`, 'INVALID_ARGS');
                }
                const raw = fs.readFileSync(opts.eventsFile, 'utf8');
                try {
                    events = JSON.parse(raw);
                }
                catch (e) {
                    (0, http_1.outputError)(`--events-file 内容不是合法 JSON: ${e.message}`, 'INVALID_ARGS');
                }
            }
            if (!Array.isArray(events)) {
                (0, http_1.outputError)('events 必须是数组', 'INVALID_ARGS');
            }
            for (const [i, e] of events.entries()) {
                if (!e || typeof e !== 'object') {
                    (0, http_1.outputError)(`events[${i}] 不是对象`, 'INVALID_ARGS');
                }
                if (!('eventType' in e) || !('name' in e) || !('expectedUsers' in e)) {
                    (0, http_1.outputError)(`events[${i}] 缺少必填字段 eventType/name/expectedUsers`, 'INVALID_ARGS');
                }
            }
            const correctedDauInput = parseNumberOpt(opts.correctedDau);
            const quotaInput = parseNumberOpt(opts.quota);
            const payload = {
                date: opts.date,
                correctedDau: correctedDauInput !== undefined ? correctedDauInput : null,
                quota: quotaInput !== undefined ? quotaInput : null,
                correctionNote: opts.correctionNote !== undefined ? opts.correctionNote : null,
                events,
            };
            const { status, data } = await submitCorrect(reqOpts, payload);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
}
//# sourceMappingURL=correct.js.map
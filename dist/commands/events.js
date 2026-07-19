"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventsCommand = registerEventsCommand;
const http_1 = require("../utils/http");
function registerEventsCommand(program) {
    const events = program
        .command('events')
        .description('增长事件管理（增删改查）');
    events
        .command('list')
        .description('按日期范围与事件类型查询事件列表')
        .option('--start-date <date>', '起始日期（含），YYYY-MM-DD')
        .option('--end-date <date>', '结束日期（含），YYYY-MM-DD')
        .option('--event-type <type>', '事件类型过滤: activation | recall')
        .action(async (opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const params = new URLSearchParams();
            if (opts.startDate)
                params.append('startDate', opts.startDate);
            if (opts.endDate)
                params.append('endDate', opts.endDate);
            if (opts.eventType)
                params.append('eventType', opts.eventType);
            const query = params.toString() ? `?${params.toString()}` : '';
            const { status, data } = await (0, http_1.apiRequest)('GET', `/openapi/events${query}`, reqOpts);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    events
        .command('get <id>')
        .description('根据 ID 获取单个事件详情')
        .action(async (id) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const { status, data } = await (0, http_1.apiRequest)('GET', `/openapi/events/${id}`, reqOpts);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    events
        .command('create')
        .description('新增一个事件（同时触发后续 DAU 重算）')
        .requiredOption('--date <date>', '事件日期，YYYY-MM-DD')
        .requiredOption('--event-type <type>', '事件类型: activation | recall')
        .requiredOption('--name <name>', '事件名称')
        .requiredOption('--expected-users <number>', '预计影响用户数（万）')
        .option('--tags <tags>', '分类标签，逗号分隔')
        .action(async (opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const body = {
                date: opts.date,
                eventType: opts.eventType,
                name: opts.name,
                expectedUsers: parseFloat(opts.expectedUsers),
            };
            if (opts.tags) {
                body.tags = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
            const { status, data } = await (0, http_1.apiRequest)('POST', '/openapi/events', reqOpts, body);
            (0, http_1.handleApiResponse)(status, data, 201);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    events
        .command('update <id>')
        .description('根据 ID 更新事件（部分字段，支持日期变更）')
        .option('--date <date>', '事件日期，YYYY-MM-DD（变更日期）')
        .option('--name <name>', '事件名称')
        .option('--expected-users <number>', '预计影响用户数（万）')
        .option('--tags <tags>', '分类标签，逗号分隔')
        .action(async (id, opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const body = {};
            if (opts.date !== undefined)
                body.date = opts.date;
            if (opts.name !== undefined)
                body.name = opts.name;
            if (opts.expectedUsers !== undefined)
                body.expectedUsers = parseFloat(opts.expectedUsers);
            if (opts.tags !== undefined) {
                body.tags = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
            if (Object.keys(body).length === 0) {
                (0, http_1.outputError)('至少需要提供一个要更新的字段（--date, --name, --expected-users, --tags）', 'INVALID_ARGS');
            }
            const { status, data } = await (0, http_1.apiRequest)('PUT', `/openapi/events/${id}`, reqOpts, body);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
    events
        .command('delete <id>')
        .description('根据 ID 删除事件（同时触发后续 DAU 重算）')
        .action(async (id) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const { status, data } = await (0, http_1.apiRequest)('DELETE', `/openapi/events/${id}`, reqOpts);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
}
//# sourceMappingURL=events.js.map
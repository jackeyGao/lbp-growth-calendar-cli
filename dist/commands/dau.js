"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDauCommand = registerDauCommand;
const http_1 = require("../utils/http");
function registerDauCommand(program) {
    const dau = program
        .command('dau')
        .description('DAU 数据查询');
    dau
        .command('list')
        .description('按日期范围查询每日 DAU 数据（含事件与变更记录）')
        .option('--start-date <date>', '起始日期（含），YYYY-MM-DD')
        .option('--end-date <date>', '结束日期（含），YYYY-MM-DD')
        .action(async (opts) => {
        try {
            const reqOpts = (0, http_1.getRequestOptions)();
            const params = new URLSearchParams();
            if (opts.startDate)
                params.append('startDate', opts.startDate);
            if (opts.endDate)
                params.append('endDate', opts.endDate);
            const query = params.toString() ? `?${params.toString()}` : '';
            const { status, data } = await (0, http_1.apiRequest)('GET', `/openapi/dau${query}`, reqOpts);
            (0, http_1.handleApiResponse)(status, data);
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'REQUEST_FAILED');
        }
    });
}
//# sourceMappingURL=dau.js.map
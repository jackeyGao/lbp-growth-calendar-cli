import { Command } from 'commander';
import { apiRequest, getRequestOptions, handleApiResponse, outputError } from '../utils/http';

export function registerDauCommand(program: Command): void {
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
        const reqOpts = getRequestOptions();
        const params = new URLSearchParams();
        if (opts.startDate) params.append('startDate', opts.startDate);
        if (opts.endDate) params.append('endDate', opts.endDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const { status, data } = await apiRequest('GET', `/openapi/dau${query}`, reqOpts);
        handleApiResponse(status, data);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });
}

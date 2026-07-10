import { Command } from 'commander';
import { apiRequest, getRequestOptions, handleApiResponse, outputError } from '../utils/http';

export function registerEventsCommand(program: Command): void {
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
        const reqOpts = getRequestOptions();
        const params = new URLSearchParams();
        if (opts.startDate) params.append('startDate', opts.startDate);
        if (opts.endDate) params.append('endDate', opts.endDate);
        if (opts.eventType) params.append('eventType', opts.eventType);
        const query = params.toString() ? `?${params.toString()}` : '';
        const { status, data } = await apiRequest('GET', `/openapi/events${query}`, reqOpts);
        handleApiResponse(status, data);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });

  events
    .command('get <id>')
    .description('根据 ID 获取单个事件详情')
    .action(async (id) => {
      try {
        const reqOpts = getRequestOptions();
        const { status, data } = await apiRequest('GET', `/openapi/events/${id}`, reqOpts);
        handleApiResponse(status, data);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
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
        const reqOpts = getRequestOptions();
        const body: Record<string, unknown> = {
          date: opts.date,
          eventType: opts.eventType,
          name: opts.name,
          expectedUsers: parseFloat(opts.expectedUsers),
        };
        if (opts.tags) {
          body.tags = opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
        const { status, data } = await apiRequest('POST', '/openapi/events', reqOpts, body);
        handleApiResponse(status, data, 201);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });

  events
    .command('update <id>')
    .description('根据 ID 更新事件（部分字段）')
    .option('--name <name>', '事件名称')
    .option('--expected-users <number>', '预计影响用户数（万）')
    .option('--tags <tags>', '分类标签，逗号分隔')
    .action(async (id, opts) => {
      try {
        const reqOpts = getRequestOptions();
        const body: Record<string, unknown> = {};
        if (opts.name !== undefined) body.name = opts.name;
        if (opts.expectedUsers !== undefined) body.expectedUsers = parseFloat(opts.expectedUsers);
        if (opts.tags !== undefined) {
          body.tags = opts.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
        if (Object.keys(body).length === 0) {
          outputError(
            '至少需要提供一个要更新的字段（--name, --expected-users, --tags）',
            'INVALID_ARGS'
          );
        }
        const { status, data } = await apiRequest('PUT', `/openapi/events/${id}`, reqOpts, body);
        handleApiResponse(status, data);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });

  events
    .command('delete <id>')
    .description('根据 ID 删除事件（同时触发后续 DAU 重算）')
    .action(async (id) => {
      try {
        const reqOpts = getRequestOptions();
        const { status, data } = await apiRequest('DELETE', `/openapi/events/${id}`, reqOpts);
        handleApiResponse(status, data);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });
}

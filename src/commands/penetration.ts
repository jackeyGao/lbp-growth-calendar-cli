import { Command } from 'commander';
import { apiRequest, getRequestOptions, handleApiResponse, outputError } from '../utils/http';

export function registerPenetrationCommand(program: Command): void {
  const penetration = program
    .command('penetration')
    .description('AI 渗透率数据管理（查询与写入）');

  // list - 查询列表
  penetration
    .command('list')
    .description('按日期范围查询 AI 渗透数据列表')
    .option('--start-date <date>', '起始日期（含），YYYY-MM-DD')
    .option('--end-date <date>', '结束日期（含），YYYY-MM-DD')
    .action(async (opts) => {
      try {
        const reqOpts = getRequestOptions();
        const params = new URLSearchParams();
        if (opts.startDate) params.append('startDate', opts.startDate);
        if (opts.endDate) params.append('endDate', opts.endDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const { status, data } = await apiRequest('GET', `/openapi/ai-penetration${query}`, reqOpts);
        handleApiResponse(status, data);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });

  // create - 新增数据
  penetration
    .command('create')
    .description('新增一条 AI 渗透数据')
    .requiredOption('--type <type>', '类型: free | paid')
    .requiredOption('--date <date>', '数据日期，YYYY-MM-DD')
    .option('--tenant-type <type>', '租户类型（type=free 时必填）')
    .option('--customer-industry <industry>', '客户行业（type=paid 时必填）')
    .option('--feishu-dau <number>', '飞书DAU')
    .option('--feishu-wau <number>', '飞书WAU')
    .option('--feishu-pc-dau <number>', '飞书PC DAU')
    .option('--feishu-pc-wau <number>', '飞书PC WAU')
    .option('--activated-users <number>', '激活智能伙伴用户数')
    .option('--smart-partner-dau <number>', '智能伙伴DAU')
    .option('--miaoda-dev-dau <number>', '妙搭开发DAU')
    .option('--penetration-rate <number>', '智能伙伴在飞书DAU的渗透率')
    .option('--activation-rate-dau <number>', '激活用户数/飞书DAU')
    .option('--activation-rate-wau <number>', '激活用户数/飞书WAU')
    .option('--activation-rate-pc-wau <number>', '激活用户数/飞书PC端WAU')
    .option('--smart-partner-dau-by-pc-wau <number>', '智能伙伴DAU/飞书PC端WAU')
    .option('--quota-aily <number>', '企业付费额度消耗_Aily(日)')
    .option('--quota-miaoda <number>', '企业付费额度消耗_妙搭(日)')
    .option('--quota-lbp <number>', '企业付费额度消耗_LBP(日)')
    .option('--quota-ai <number>', '企业付费额度消耗_AI(日)')
    .option('--arr <number>', 'ARR (人民币)')
    .option('--predicted-activation-space <number>', '预测-待激活空间')
    .option('--predicted-activation-count <number>', '预测-假设激活率下的激活数')
    .option('--next-day-retention-rate <number>', '激活后次日留存率')
    .option('--predicted-next-day-retained <number>', '预测-激活后次日留下用户数')
    .option('--predicted-long-term-retained <number>', '预测-长期留下')
    .option('--predicted-daily-consumption <number>', '预测-预测的日消耗')
    .option('--active-dialog-rate <number>', '激活当天用户主动对话率')
    .option('--active-dialog-5plus-rate <number>', '激活当天用户主动5次以上对话率')
    .option('--weekly-scheduled-task-rate <number>', '激活后一周定时任务创建率')
    .option('--smart-partner-dau-by-activated <number>', '智能伙伴DAU/激活用户数')
    .action(async (opts) => {
      try {
        const reqOpts = getRequestOptions();
        const body: Record<string, unknown> = {
          type: opts.type,
          dataDate: opts.date,
        };

        // 根据类型添加必填字段
        if (opts.type === 'free' && opts.tenantType) {
          body.tenantType = opts.tenantType;
        }
        if (opts.type === 'paid' && opts.customerIndustry) {
          body.customerIndustry = opts.customerIndustry;
        }

        // 可选字段
        if (opts.feishuDau !== undefined) body.feishuDau = parseFloat(opts.feishuDau);
        if (opts.feishuWau !== undefined) body.feishuWau = parseFloat(opts.feishuWau);
        if (opts.feishuPcDau !== undefined) body.feishuPcDau = parseFloat(opts.feishuPcDau);
        if (opts.feishuPcWau !== undefined) body.feishuPcWau = parseFloat(opts.feishuPcWau);
        if (opts.activatedUsers !== undefined) body.activatedSmartPartnerUsers = parseFloat(opts.activatedUsers);
        if (opts.smartPartnerDau !== undefined) body.smartPartnerDau = parseFloat(opts.smartPartnerDau);
        if (opts.miaodaDevDau !== undefined) body.miaodaDevDau = parseFloat(opts.miaodaDevDau);
        if (opts.penetrationRate !== undefined) body.smartPartnerPenetrationRate = parseFloat(opts.penetrationRate);
        if (opts.activationRateDau !== undefined) body.activationRateByDau = parseFloat(opts.activationRateDau);
        if (opts.activationRateWau !== undefined) body.activationRateByWau = parseFloat(opts.activationRateWau);
        if (opts.activationRatePcWau !== undefined) body.activationRateByPcWau = parseFloat(opts.activationRatePcWau);
        if (opts.smartPartnerDauByPcWau !== undefined) body.smartPartnerDauByPcWau = parseFloat(opts.smartPartnerDauByPcWau);
        if (opts.quotaAily !== undefined) body.quotaConsumptionAilyDaily = parseFloat(opts.quotaAily);
        if (opts.quotaMiaoda !== undefined) body.quotaConsumptionMiaodaDaily = parseFloat(opts.quotaMiaoda);
        if (opts.quotaLbp !== undefined) body.quotaConsumptionLbpDaily = parseFloat(opts.quotaLbp);
        if (opts.quotaAi !== undefined) body.quotaConsumptionAiDaily = parseFloat(opts.quotaAi);
        if (opts.arr !== undefined) body.arrCny = parseInt(opts.arr, 10);
        if (opts.predictedActivationSpace !== undefined) body.predictedActivationSpace = parseFloat(opts.predictedActivationSpace);
        if (opts.predictedActivationCount !== undefined) body.predictedActivationCount = parseFloat(opts.predictedActivationCount);
        if (opts.nextDayRetentionRate !== undefined) body.nextDayRetentionRate = parseFloat(opts.nextDayRetentionRate);
        if (opts.predictedNextDayRetained !== undefined) body.predictedNextDayRetainedUsers = parseFloat(opts.predictedNextDayRetained);
        if (opts.predictedLongTermRetained !== undefined) body.predictedLongTermRetained = parseFloat(opts.predictedLongTermRetained);
        if (opts.predictedDailyConsumption !== undefined) body.predictedDailyConsumption = parseFloat(opts.predictedDailyConsumption);
        if (opts.activeDialogRate !== undefined) body.activeDialogRate = parseFloat(opts.activeDialogRate);
        if (opts.activeDialog5plusRate !== undefined) body.activeDialog5plusRate = parseFloat(opts.activeDialog5plusRate);
        if (opts.weeklyScheduledTaskRate !== undefined) body.weeklyScheduledTaskCreationRate = parseFloat(opts.weeklyScheduledTaskRate);
        if (opts.smartPartnerDauByActivated !== undefined) body.smartPartnerDauByActivatedUsers = parseFloat(opts.smartPartnerDauByActivated);

        const { status, data } = await apiRequest('POST', '/openapi/ai-penetration', reqOpts, body);
        handleApiResponse(status, data, 201);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });

  // upsert - 更新或插入（幂等）
  penetration
    .command('upsert')
    .description('按幂等键更新或插入 AI 渗透数据（free: dataDate+type+tenantType; paid: dataDate+type+customerIndustry）')
    .requiredOption('--type <type>', '类型: free | paid')
    .requiredOption('--date <date>', '数据日期，YYYY-MM-DD')
    .option('--tenant-type <type>', '租户类型（type=free 时必填）')
    .option('--customer-industry <industry>', '客户行业（type=paid 时必填）')
    .option('--feishu-dau <number>', '飞书DAU')
    .option('--feishu-wau <number>', '飞书WAU')
    .option('--feishu-pc-dau <number>', '飞书PC DAU')
    .option('--feishu-pc-wau <number>', '飞书PC WAU')
    .option('--activated-users <number>', '激活智能伙伴用户数')
    .option('--smart-partner-dau <number>', '智能伙伴DAU')
    .option('--miaoda-dev-dau <number>', '妙搭开发DAU')
    .option('--penetration-rate <number>', '智能伙伴在飞书DAU的渗透率')
    .option('--activation-rate-dau <number>', '激活用户数/飞书DAU')
    .option('--activation-rate-wau <number>', '激活用户数/飞书WAU')
    .option('--activation-rate-pc-wau <number>', '激活用户数/飞书PC端WAU')
    .option('--smart-partner-dau-by-pc-wau <number>', '智能伙伴DAU/飞书PC端WAU')
    .option('--quota-aily <number>', '企业付费额度消耗_Aily(日)')
    .option('--quota-miaoda <number>', '企业付费额度消耗_妙搭(日)')
    .option('--quota-lbp <number>', '企业付费额度消耗_LBP(日)')
    .option('--quota-ai <number>', '企业付费额度消耗_AI(日)')
    .option('--arr <number>', 'ARR (人民币)')
    .option('--predicted-activation-space <number>', '预测-待激活空间')
    .option('--predicted-activation-count <number>', '预测-假设激活率下的激活数')
    .option('--next-day-retention-rate <number>', '激活后次日留存率')
    .option('--predicted-next-day-retained <number>', '预测-激活后次日留下用户数')
    .option('--predicted-long-term-retained <number>', '预测-长期留下')
    .option('--predicted-daily-consumption <number>', '预测-预测的日消耗')
    .option('--active-dialog-rate <number>', '激活当天用户主动对话率')
    .option('--active-dialog-5plus-rate <number>', '激活当天用户主动5次以上对话率')
    .option('--weekly-scheduled-task-rate <number>', '激活后一周定时任务创建率')
    .option('--smart-partner-dau-by-activated <number>', '智能伙伴DAU/激活用户数')
    .action(async (opts) => {
      try {
        const reqOpts = getRequestOptions();
        const body: Record<string, unknown> = {
          type: opts.type,
          dataDate: opts.date,
        };

        // 根据类型添加必填字段
        if (opts.type === 'free' && opts.tenantType) {
          body.tenantType = opts.tenantType;
        }
        if (opts.type === 'paid' && opts.customerIndustry) {
          body.customerIndustry = opts.customerIndustry;
        }

        // 可选字段
        if (opts.feishuDau !== undefined) body.feishuDau = parseFloat(opts.feishuDau);
        if (opts.feishuWau !== undefined) body.feishuWau = parseFloat(opts.feishuWau);
        if (opts.feishuPcDau !== undefined) body.feishuPcDau = parseFloat(opts.feishuPcDau);
        if (opts.feishuPcWau !== undefined) body.feishuPcWau = parseFloat(opts.feishuPcWau);
        if (opts.activatedUsers !== undefined) body.activatedSmartPartnerUsers = parseFloat(opts.activatedUsers);
        if (opts.smartPartnerDau !== undefined) body.smartPartnerDau = parseFloat(opts.smartPartnerDau);
        if (opts.miaodaDevDau !== undefined) body.miaodaDevDau = parseFloat(opts.miaodaDevDau);
        if (opts.penetrationRate !== undefined) body.smartPartnerPenetrationRate = parseFloat(opts.penetrationRate);
        if (opts.activationRateDau !== undefined) body.activationRateByDau = parseFloat(opts.activationRateDau);
        if (opts.activationRateWau !== undefined) body.activationRateByWau = parseFloat(opts.activationRateWau);
        if (opts.activationRatePcWau !== undefined) body.activationRateByPcWau = parseFloat(opts.activationRatePcWau);
        if (opts.smartPartnerDauByPcWau !== undefined) body.smartPartnerDauByPcWau = parseFloat(opts.smartPartnerDauByPcWau);
        if (opts.quotaAily !== undefined) body.quotaConsumptionAilyDaily = parseFloat(opts.quotaAily);
        if (opts.quotaMiaoda !== undefined) body.quotaConsumptionMiaodaDaily = parseFloat(opts.quotaMiaoda);
        if (opts.quotaLbp !== undefined) body.quotaConsumptionLbpDaily = parseFloat(opts.quotaLbp);
        if (opts.quotaAi !== undefined) body.quotaConsumptionAiDaily = parseFloat(opts.quotaAi);
        if (opts.arr !== undefined) body.arrCny = parseInt(opts.arr, 10);
        if (opts.predictedActivationSpace !== undefined) body.predictedActivationSpace = parseFloat(opts.predictedActivationSpace);
        if (opts.predictedActivationCount !== undefined) body.predictedActivationCount = parseFloat(opts.predictedActivationCount);
        if (opts.nextDayRetentionRate !== undefined) body.nextDayRetentionRate = parseFloat(opts.nextDayRetentionRate);
        if (opts.predictedNextDayRetained !== undefined) body.predictedNextDayRetainedUsers = parseFloat(opts.predictedNextDayRetained);
        if (opts.predictedLongTermRetained !== undefined) body.predictedLongTermRetained = parseFloat(opts.predictedLongTermRetained);
        if (opts.predictedDailyConsumption !== undefined) body.predictedDailyConsumption = parseFloat(opts.predictedDailyConsumption);
        if (opts.activeDialogRate !== undefined) body.activeDialogRate = parseFloat(opts.activeDialogRate);
        if (opts.activeDialog5plusRate !== undefined) body.activeDialog5plusRate = parseFloat(opts.activeDialog5plusRate);
        if (opts.weeklyScheduledTaskRate !== undefined) body.weeklyScheduledTaskCreationRate = parseFloat(opts.weeklyScheduledTaskRate);
        if (opts.smartPartnerDauByActivated !== undefined) body.smartPartnerDauByActivatedUsers = parseFloat(opts.smartPartnerDauByActivated);

        const { status, data } = await apiRequest('PUT', '/openapi/ai-penetration', reqOpts, body);
        handleApiResponse(status, data, 200);
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'REQUEST_FAILED'
        );
      }
    });
}

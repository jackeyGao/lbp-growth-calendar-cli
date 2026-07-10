#!/usr/bin/env node

import { Command } from 'commander';
import { registerDauCommand } from './commands/dau';
import { registerEventsCommand } from './commands/events';
import { registerCorrectCommand } from './commands/correct';
import { registerAuthCommand } from './commands/auth';

const program = new Command();

program
  .name('lbp-growth-calendar')
  .description('增长日历 CLI 工具 - 管理 DAU 数据、事件与订正\n\nAgent AI Friendly: 所有命令默认输出结构化 JSON，适合程序化调用。\nToken 可以找 jg 要，配置后执行：lbp-growth-calendar auth save <token>')
  .version('1.2.2')
  .option('--token <token>', '认证 Token（优先级高于本地配置文件）', process.env.LBP_GROWTH_CALENDAR_TOKEN || '');

registerAuthCommand(program);
registerDauCommand(program);
registerEventsCommand(program);
registerCorrectCommand(program);

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

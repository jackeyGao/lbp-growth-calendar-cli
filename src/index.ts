#!/usr/bin/env node

import { Command } from 'commander';
import { registerDauCommand } from './commands/dau';
import { registerEventsCommand } from './commands/events';
import { registerCorrectCommand } from './commands/correct';
import { registerAuthCommand } from './commands/auth';

const program = new Command();

program
  .name('lbp-growth-calendar')
  .description('增长日历 CLI 工具 - 管理 DAU 数据、事件与订正\n\nAgent AI Friendly: 所有命令默认输出结构化 JSON，适合程序化调用。')
  .version('2.8.0');

registerAuthCommand(program);
registerDauCommand(program);
registerEventsCommand(program);
registerCorrectCommand(program);

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

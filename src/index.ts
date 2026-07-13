#!/usr/bin/env node

import { Command } from 'commander';
import { registerDauCommand } from './commands/dau';
import { registerEventsCommand } from './commands/events';
import { registerCorrectCommand } from './commands/correct';
import { registerAuthCommand } from './commands/auth';
import { registerPenetrationCommand } from './commands/penetration';
import { setRuntimeToken } from './utils/config';

const program = new Command();

program
  .name('lbp-growth-calendar')
  .description('增长日历 CLI 工具 - 管理 DAU 数据、事件与订正\n\nAgent AI Friendly: 所有命令默认输出结构化 JSON，适合程序化调用。')
  .version('2.5.0')
  .option('--token <token>', '本次命令使用的 Bearer Token（优先级高于环境变量和配置文件）')
  .hook('preAction', (_thisCommand, actionCommand) => {
    const opts = actionCommand.optsWithGlobals() as { token?: string };
    setRuntimeToken(opts.token);
  });

registerAuthCommand(program);
registerDauCommand(program);
registerEventsCommand(program);
registerCorrectCommand(program);
registerPenetrationCommand(program);

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

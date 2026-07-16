#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const dau_1 = require("./commands/dau");
const events_1 = require("./commands/events");
const correct_1 = require("./commands/correct");
const auth_1 = require("./commands/auth");
const program = new commander_1.Command();
program
    .name('lbp-growth-calendar')
    .description('增长日历 CLI 工具 - 管理 DAU 数据、事件与订正\n\nAgent AI Friendly: 所有命令默认输出结构化 JSON，适合程序化调用。')
    .version('2.7.0');
(0, auth_1.registerAuthCommand)(program);
(0, dau_1.registerDauCommand)(program);
(0, events_1.registerEventsCommand)(program);
(0, correct_1.registerCorrectCommand)(program);
program.parse();
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map
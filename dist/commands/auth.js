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
exports.registerAuthCommand = registerAuthCommand;
const readline = __importStar(require("readline"));
const config_1 = require("../utils/config");
const http_1 = require("../utils/http");
function registerAuthCommand(program) {
    const auth = program
        .command('auth')
        .description('认证管理（Token 配置）');
    // auth save --token <token>
    auth
        .command('save')
        .description('保存 Token 到本地配置文件')
        .option('--token <token>', '要保存的 Token')
        .action(async (opts) => {
        let token = opts.token || '';
        if (!token) {
            // 交互式输入
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            token = await new Promise((resolve) => {
                rl.question('请输入 Token（Token 可以找 jg 要）：', (answer) => {
                    rl.close();
                    resolve(answer.trim());
                });
            });
        }
        if (!token) {
            (0, http_1.outputJSON)({ ok: false, error: 'INVALID_ARGS', message: 'Token 不能为空' });
            process.exit(1);
        }
        (0, config_1.saveToken)(token);
        (0, http_1.outputJSON)({
            ok: true,
            message: `Token 已保存到 ${(0, config_1.configFilePath)()}`,
            hint: '如 Token 失效，请联系 jg 重新获取后再次执行 auth save',
        });
    });
    // auth status
    auth
        .command('status')
        .description('查看当前 Token 配置状态')
        .action(() => {
        const token = (0, config_1.getToken)();
        if (token) {
            (0, http_1.outputJSON)({
                ok: true,
                configured: true,
                tokenPreview: `${token.slice(0, 6)}...${token.slice(-4)}`,
                configFile: (0, config_1.configFilePath)(),
            });
        }
        else {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                message: '尚未配置 Token，请执行：lbp-growth-calendar auth save --token <your-token>\nToken 可以找 jg 要',
                configFile: (0, config_1.configFilePath)(),
            });
        }
    });
    // auth clear
    auth
        .command('clear')
        .description('清除本地保存的 Token')
        .action(() => {
        (0, config_1.saveToken)('');
        (0, http_1.outputJSON)({ ok: true, message: 'Token 已清除' });
    });
}
//# sourceMappingURL=auth.js.map
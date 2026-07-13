"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommand = registerAuthCommand;
const config_1 = require("../utils/config");
const http_1 = require("../utils/http");
function maskToken(token) {
    if (token.length <= 10) {
        return `${token.slice(0, 3)}***`;
    }
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
}
function registerAuthCommand(program) {
    const auth = program
        .command('auth')
        .description('认证管理（Bearer Token 配置）');
    auth
        .command('save <token>')
        .description('保存 Bearer Token 到本地配置文件')
        .action((token) => {
        const normalized = token.trim();
        if (!normalized) {
            (0, http_1.outputError)('Token 不能为空', 'INVALID_ARGS');
        }
        (0, config_1.saveToken)(normalized);
        (0, http_1.outputJSON)({
            ok: true,
            message: 'Bearer Token 已保存',
            configured: true,
            configFile: (0, config_1.configFilePath)(),
        });
    });
    auth
        .command('status')
        .description('查看当前 Token 配置状态')
        .action(() => {
        const effectiveToken = (0, config_1.getToken)();
        const savedToken = (0, config_1.getSavedToken)();
        const envToken = process.env[(0, config_1.getTokenEnvKey)()]?.trim();
        let source = 'none';
        if (envToken) {
            source = 'env';
        }
        else if (savedToken) {
            source = 'file';
        }
        (0, http_1.outputJSON)({
            ok: true,
            configured: (0, config_1.hasToken)(),
            token: effectiveToken
                ? {
                    configured: true,
                    source,
                    preview: maskToken(effectiveToken),
                }
                : {
                    configured: false,
                },
            configFile: (0, config_1.configFilePath)(),
            envKey: (0, config_1.getTokenEnvKey)(),
            message: effectiveToken
                ? 'Bearer Token 已配置'
                : '尚未配置 Bearer Token',
            setupInstructions: effectiveToken
                ? undefined
                : [
                    '方式 1：lbp-growth-calendar auth save <token>',
                    `方式 2：export ${(0, config_1.getTokenEnvKey)()}="your_bearer_token_here"`,
                    '方式 3：本次命令追加 --token <token>',
                ],
        });
    });
    auth
        .command('clear')
        .description('清除本地保存的 Bearer Token')
        .action(() => {
        (0, config_1.clearAuth)();
        (0, http_1.outputJSON)({
            ok: true,
            message: '本地保存的 Bearer Token 已清除',
            note: `如果环境变量 ${(0, config_1.getTokenEnvKey)()} 仍存在，命令仍可继续使用该环境变量。`,
        });
    });
}
//# sourceMappingURL=auth.js.map
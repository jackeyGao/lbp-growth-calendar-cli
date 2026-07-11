"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommand = registerAuthCommand;
const config_1 = require("../utils/config");
const http_1 = require("../utils/http");
function registerAuthCommand(program) {
    const auth = program
        .command('auth')
        .description('认证管理（Token 配置）');
    // auth init - 发起授权流程
    auth
        .command('init')
        .description('发起授权流程，获取授权码和授权链接')
        .action(async () => {
        try {
            const { status, data } = await (0, http_1.apiRequestNoAuth)('POST', '/openapi/agent-auth/init');
            if (status !== 200) {
                (0, http_1.outputError)(`发起授权失败: HTTP ${status}`, 'AUTH_INIT_FAILED');
                return;
            }
            const response = data;
            (0, http_1.outputJSON)({
                ok: true,
                message: '授权流程已发起',
                authCode: response.code,
                authUrl: response.authUrl,
                instructions: [
                    '1. 在浏览器中访问上面的 authUrl',
                    '2. 完成登录授权',
                    '3. 执行: lbp-growth-calendar auth verify ' + response.code,
                ],
            });
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'AUTH_INIT_FAILED');
        }
    });
    // auth verify <code> - 用 authCode 换取 token
    auth
        .command('verify <code>')
        .description('用授权码换取 token')
        .action(async (code) => {
        try {
            const { status, data } = await (0, http_1.apiRequestNoAuth)('POST', '/openapi/agent-auth/verify', { code });
            if (status === 404) {
                (0, http_1.outputError)('无效的授权码', 'INVALID_AUTH_CODE');
                return;
            }
            if (status !== 200) {
                (0, http_1.outputError)(`验证授权码失败: HTTP ${status}`, 'AUTH_VERIFY_FAILED');
                return;
            }
            const response = data;
            if (response.status === 'pending') {
                (0, http_1.outputJSON)({
                    ok: false,
                    error: 'AUTH_PENDING',
                    message: '用户尚未完成授权，请在浏览器中访问 auth init 提供的链接完成授权',
                    status: response.status,
                });
                return;
            }
            if (response.status === 'expired') {
                (0, http_1.outputJSON)({
                    ok: false,
                    error: 'AUTH_EXPIRED',
                    message: '授权码已过期，请重新执行 lbp-growth-calendar auth init',
                    status: response.status,
                });
                return;
            }
            if (response.status === 'completed' && response.token) {
                (0, config_1.saveToken)(response.token);
                (0, http_1.outputJSON)({
                    ok: true,
                    message: '授权成功，Token 已保存',
                    user: {
                        userId: response.userId,
                        userName: response.userName,
                    },
                    expiresAt: response.expiresAt,
                    configFile: (0, config_1.configFilePath)(),
                });
                return;
            }
            (0, http_1.outputError)('未知的授权状态', 'UNKNOWN_AUTH_STATUS');
        }
        catch (error) {
            (0, http_1.outputError)(error instanceof Error ? error.message : String(error), 'AUTH_VERIFY_FAILED');
        }
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
                message: '尚未配置 Token，请执行授权流程：\n  1. lbp-growth-calendar auth init\n  2. 在浏览器中完成授权\n  3. lbp-growth-calendar auth verify <auth-code>',
                configFile: (0, config_1.configFilePath)(),
            });
        }
    });
    // auth clear
    auth
        .command('clear')
        .description('清除本地保存的 Token')
        .action(() => {
        (0, config_1.clearToken)();
        (0, http_1.outputJSON)({ ok: true, message: 'Token 已清除' });
    });
}
//# sourceMappingURL=auth.js.map
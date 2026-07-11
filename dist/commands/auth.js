"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommand = registerAuthCommand;
const config_1 = require("../utils/config");
const http_1 = require("../utils/http");
// 联系人信息
const CONTACT_INFO = '请联系 jg（俊奇）获取';
function registerAuthCommand(program) {
    const auth = program
        .command('auth')
        .description('认证管理（Token 配置）');
    // auth init - 发起授权流程，需要提供 bearer token
    auth
        .command('init')
        .description('发起授权流程，获取授权码和授权链接')
        .requiredOption('--bearer-token <token>', `Bearer Token（${CONTACT_INFO}）`)
        .action(async (opts) => {
        try {
            const bearerToken = opts.bearerToken;
            if (!bearerToken) {
                (0, http_1.outputError)(`Bearer Token 不能为空。${CONTACT_INFO} --bearer-token 参数。`, 'MISSING_BEARER_TOKEN');
                return;
            }
            // 使用用户提供的 Bearer Token 调用 init 接口
            const { status, data } = await (0, http_1.apiRequestWithBearer)('POST', '/openapi/agent-auth/init', bearerToken);
            if (status === 401 || status === 403) {
                // 错误详情由 http.ts 中的 checkAuthError 处理
                return;
            }
            if (status !== 200) {
                (0, http_1.outputError)(`发起授权失败: HTTP ${status}。可能原因：1) Bearer Token 无效；2) 服务暂不可用。${CONTACT_INFO}有效的 Bearer Token 或稍后再试。`, 'AUTH_INIT_FAILED');
                return;
            }
            const response = data;
            // 成功后保存用户提供的 Bearer Token
            (0, config_1.saveBearerToken)(bearerToken);
            (0, http_1.outputJSON)({
                ok: true,
                message: '授权流程已发起，Bearer Token 已保存到本地配置',
                authCode: response.code,
                authUrl: response.authUrl,
                instructions: [
                    '步骤 1（已完成）: 在 CLI 中执行 init，保存 Bearer Token',
                    '步骤 2: 【用户手动操作】在浏览器中访问上面的 authUrl，完成登录授权',
                    '步骤 3: 在 CLI 中执行: lbp-growth-calendar auth verify ' + response.code,
                ],
                warning: '步骤 2 必须由用户手动在浏览器中完成，Agent 绝对不能自动调用浏览器或尝试自动化登录流程。',
                note: `Bearer Token 已保存。后续获取 API Key 后即可访问业务接口。如有问题，${CONTACT_INFO}技术支持。`,
            });
        }
        catch (error) {
            (0, http_1.outputError)(`授权流程异常: ${error instanceof Error ? error.message : String(error)}。${CONTACT_INFO}技术支持。`, 'AUTH_INIT_FAILED');
        }
    });
    // auth verify <code> - 用 authCode 换取 API Key
    auth
        .command('verify <code>')
        .description('用授权码换取 API Key')
        .action(async (code) => {
        try {
            // 获取已保存的 bearer token
            const bearerToken = (0, config_1.getBearerToken)();
            if (!bearerToken) {
                (0, http_1.outputError)(`未找到 Bearer Token。请先执行 init 步骤：lbp-growth-calendar auth init --bearer-token <token>。${CONTACT_INFO}获取 Bearer Token。`, 'MISSING_BEARER_TOKEN');
                return;
            }
            const { status, data } = await (0, http_1.apiRequestWithBearer)('POST', '/openapi/agent-auth/verify', bearerToken, { code });
            if (status === 404) {
                (0, http_1.outputError)(`无效的授权码: ${code}。可能原因：1) 授权码已过期；2) 授权码输入错误；3) 用户未在浏览器中完成授权。建议重新执行 init 获取新的授权码。`, 'INVALID_AUTH_CODE');
                return;
            }
            if (status === 401 || status === 403) {
                // 错误详情由 http.ts 中的 checkAuthError 处理
                return;
            }
            if (status !== 200) {
                (0, http_1.outputError)(`验证授权码失败: HTTP ${status}。请检查网络连接或 ${CONTACT_INFO}技术支持。`, 'AUTH_VERIFY_FAILED');
                return;
            }
            const response = data;
            if (response.status === 'pending') {
                (0, http_1.outputJSON)({
                    ok: false,
                    error: 'AUTH_PENDING',
                    message: `用户尚未完成浏览器授权。请在浏览器中访问 auth init 提供的 authUrl 完成授权，然后重新执行 verify。`,
                    status: response.status,
                    suggestion: [
                        '1. 检查浏览器是否已完成授权流程',
                        '2. 确认使用的是最新的授权码',
                        `3. 如问题持续，${CONTACT_INFO}技术支持`,
                    ],
                });
                return;
            }
            if (response.status === 'expired') {
                (0, http_1.outputJSON)({
                    ok: false,
                    error: 'AUTH_EXPIRED',
                    message: `授权码已过期。请重新执行：lbp-growth-calendar auth init --bearer-token <token> 获取新的授权码。`,
                    status: response.status,
                    suggestion: [
                        '1. 重新执行 init 获取新的授权码',
                        '2. 在浏览器中尽快完成授权',
                        `3. 如频繁过期，${CONTACT_INFO}技术支持`,
                    ],
                });
                return;
            }
            if (response.status === 'completed' && response.token) {
                // 保存 API Key（Bearer Token 已在 init 时保存）
                (0, config_1.saveApiKey)(response.token);
                (0, http_1.outputJSON)({
                    ok: true,
                    message: '授权成功！Bearer Token 和 API Key 都已保存',
                    user: {
                        userId: response.userId,
                        userName: response.userName,
                    },
                    expiresAt: response.expiresAt,
                    configFile: (0, config_1.configFilePath)(),
                    note: `两个 Token 已保存：Bearer Token（固定长期有效）+ API Key（动态，过期时间见 expiresAt）。现在可以访问业务接口了。`,
                });
                return;
            }
            (0, http_1.outputError)(`未知的授权状态: ${response.status}。${CONTACT_INFO}技术支持。`, 'UNKNOWN_AUTH_STATUS');
        }
        catch (error) {
            (0, http_1.outputError)(`验证授权码异常: ${error instanceof Error ? error.message : String(error)}。${CONTACT_INFO}技术支持。`, 'AUTH_VERIFY_FAILED');
        }
    });
    // auth status
    auth
        .command('status')
        .description('查看当前 Token 配置状态')
        .action(() => {
        const bearerToken = (0, config_1.getBearerToken)();
        const apiKey = (0, config_1.getApiKey)();
        if (bearerToken && apiKey) {
            (0, http_1.outputJSON)({
                ok: true,
                configured: true,
                bearerToken: {
                    configured: true,
                    preview: `${bearerToken.slice(0, 6)}...${bearerToken.slice(-4)}`,
                    type: '固定值（长期有效）',
                },
                apiKey: {
                    configured: true,
                    preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
                    type: '动态值（有过期时间）',
                },
                message: '授权完成，可以访问所有接口',
                configFile: (0, config_1.configFilePath)(),
            });
        }
        else if (bearerToken && !apiKey) {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                bearerToken: {
                    configured: true,
                    preview: `${bearerToken.slice(0, 6)}...${bearerToken.slice(-4)}`,
                },
                apiKey: {
                    configured: false,
                    message: '未完成 verify 步骤',
                },
                message: `Bearer Token 已配置，但 API Key 未获取。请执行 auth verify <code> 完成授权。`,
                suggestion: [
                    '1. 确认已在浏览器中完成授权',
                    '2. 执行: lbp-growth-calendar auth verify <auth-code>',
                    `3. 如丢失授权码，需重新执行 init 步骤。${CONTACT_INFO}技术支持`,
                ],
            });
        }
        else {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                bearerToken: { configured: false },
                apiKey: { configured: false },
                message: `尚未完成授权配置。`,
                setupInstructions: [
                    '步骤 1: lbp-growth-calendar auth init --bearer-token <token>',
                    '步骤 2: 在浏览器中访问输出的 authUrl 完成授权',
                    '步骤 3: lbp-growth-calendar auth verify <auth-code>',
                ],
                configFile: (0, config_1.configFilePath)(),
                note: `${CONTACT_INFO} Bearer Token。`,
            });
        }
    });
    // auth clear
    auth
        .command('clear')
        .description('清除本地保存的所有 Token')
        .action(() => {
        (0, config_1.clearTokens)();
        (0, http_1.outputJSON)({
            ok: true,
            message: '所有 Token 已清除。如需重新授权，请执行 auth init --bearer-token <token>',
            note: `如需获取新的 Bearer Token，${CONTACT_INFO}。`,
        });
    });
}
//# sourceMappingURL=auth.js.map
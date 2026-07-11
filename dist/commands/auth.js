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
    // auth init - 发起授权流程，需要提供 token
    auth
        .command('init')
        .description('发起授权流程，获取授权码和授权链接')
        .requiredOption('--token <token>', `Token（${CONTACT_INFO}）`)
        .action(async (opts) => {
        try {
            const token = opts.token;
            if (!token) {
                (0, http_1.outputError)(`Token 不能为空。${CONTACT_INFO} --token 参数。`, 'MISSING_TOKEN');
                return;
            }
            // 使用用户提供的 Token 调用 init 接口
            const { status, data } = await (0, http_1.apiRequestWithBearer)('POST', '/openapi/agent-auth/init', token);
            if (status === 401 || status === 403) {
                // 错误详情由 http.ts 中的 checkAuthError 处理
                return;
            }
            if (status !== 200) {
                (0, http_1.outputError)(`发起授权失败: HTTP ${status}。可能原因：1) Token 无效；2) 服务暂不可用。${CONTACT_INFO}有效的 Token 或稍后再试。`, 'AUTH_INIT_FAILED');
                return;
            }
            const response = data;
            // 成功后保存 Token 和授权码
            (0, config_1.saveToken)(token);
            (0, config_1.saveAuthCode)(response.code);
            (0, http_1.outputJSON)({
                ok: true,
                message: '授权流程已发起，Token 和授权码已保存到本地配置',
                authCode: response.code,
                authUrl: response.authUrl,
                instructions: [
                    '步骤 1（已完成）: 在 CLI 中执行 init，保存 Token 和授权码',
                    '步骤 2: 【用户手动操作】在浏览器中访问上面的 authUrl，完成登录授权',
                    '步骤 3: 在 CLI 中执行: lbp-growth-calendar auth verify ' + response.code,
                ],
                warning: '步骤 2 必须由用户手动在浏览器中完成，Agent 绝对不能自动调用浏览器或尝试自动化登录流程。',
                note: `Token 和授权码已保存。后续获取 API Key 后即可访问业务接口。如有问题，${CONTACT_INFO}技术支持。`,
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
            // 获取已保存的 token
            const token = (0, config_1.getToken)();
            if (!token) {
                (0, http_1.outputError)(`未找到 Token。请先执行 init 步骤：lbp-growth-calendar auth init --token <token>。${CONTACT_INFO}获取 Token。`, 'MISSING_TOKEN');
                return;
            }
            const { status, data } = await (0, http_1.apiRequestWithBearer)('POST', '/openapi/agent-auth/verify', token, { code });
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
                    message: `授权码已过期。请重新执行：lbp-growth-calendar auth init --token <token> 获取新的授权码。`,
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
                // 保存 API Key（Token 已在 init 时保存）
                (0, config_1.saveApiKey)(response.token);
                (0, http_1.outputJSON)({
                    ok: true,
                    message: '授权成功！Token 和 API Key 都已保存',
                    user: {
                        userId: response.userId,
                        userName: response.userName,
                    },
                    expiresAt: response.expiresAt,
                    configFile: (0, config_1.configFilePath)(),
                    note: `两个凭证已保存：Token（固定长期有效）+ API Key（动态，过期时间见 expiresAt）。现在可以访问业务接口了。`,
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
        .description('查看当前认证配置状态')
        .action(() => {
        const token = (0, config_1.getToken)();
        const apiKey = (0, config_1.getApiKey)();
        const authCode = (0, config_1.getAuthCode)();
        if (token && apiKey) {
            (0, http_1.outputJSON)({
                ok: true,
                configured: true,
                token: {
                    configured: true,
                    preview: `${token.slice(0, 6)}...${token.slice(-4)}`,
                    type: '固定值（长期有效）',
                },
                apiKey: {
                    configured: true,
                    preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
                    type: '动态值（有过期时间）',
                },
                authCode: authCode || '已使用或过期',
                message: '授权完成，可以访问所有接口',
                configFile: (0, config_1.configFilePath)(),
            });
        }
        else if (token && !apiKey) {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                token: {
                    configured: true,
                    preview: `${token.slice(0, 6)}...${token.slice(-4)}`,
                },
                apiKey: {
                    configured: false,
                    message: '未完成 verify 步骤',
                },
                authCode: authCode || null,
                message: `Token 已配置，但 API Key 未获取。请执行 auth verify ${authCode || '<code>'} 完成授权。`,
                suggestion: [
                    '1. 确认已在浏览器中完成授权',
                    `2. 执行: lbp-growth-calendar auth verify ${authCode || '<code>'}`,
                    `3. 如丢失授权码，需重新执行 init 步骤。${CONTACT_INFO}技术支持`,
                ],
            });
        }
        else {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                token: { configured: false },
                apiKey: { configured: false },
                authCode: null,
                message: `尚未完成授权配置。`,
                setupInstructions: [
                    '步骤 1: lbp-growth-calendar auth init --token <token>',
                    '步骤 2: 在浏览器中访问输出的 authUrl 完成授权',
                    '步骤 3: lbp-growth-calendar auth verify <auth-code>',
                ],
                configFile: (0, config_1.configFilePath)(),
                note: `${CONTACT_INFO} Token。`,
            });
        }
    });
    // auth clear
    auth
        .command('clear')
        .description('清除本地保存的所有认证信息')
        .action(() => {
        (0, config_1.clearAuth)();
        (0, http_1.outputJSON)({
            ok: true,
            message: '所有认证信息已清除。如需重新授权，请执行 auth init --token <token>',
            note: `如需获取新的 Token，${CONTACT_INFO}。`,
        });
    });
}
//# sourceMappingURL=auth.js.map
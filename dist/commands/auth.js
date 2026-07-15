"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommand = registerAuthCommand;
const config_1 = require("../utils/config");
const http_1 = require("../utils/http");
// 兜底联系人（仅用于极少数无法自助解决的场景）
const ESCALATION_CONTACT = '如上述方案无法解决，请联系 jg（俊奇）';
function registerAuthCommand(program) {
    const auth = program
        .command('auth')
        .description('认证管理（Token 配置）');
    // auth init - 发起授权流程（使用内置 Bearer Token）
    auth
        .command('init')
        .description('发起用户授权流程，获取授权码和授权链接')
        .action(async () => {
        try {
            // 使用内置的 Bearer Token 调用 init 接口
            const { status, data } = await (0, http_1.apiRequestWithBearer)('POST', '/openapi/agent-auth/init', config_1.DEFAULT_BEARER_TOKEN);
            if (status === 401 || status === 403) {
                // 错误详情由 http.ts 中的 checkAuthError 处理
                return;
            }
            if (status !== 200) {
                (0, http_1.outputError)(`发起授权失败: HTTP ${status}。建议：1) 检查网络连接；2) 稍后重试；3) ${ESCALATION_CONTACT}`, 'AUTH_INIT_FAILED');
                return;
            }
            const response = data;
            // 保存授权码和 Bearer Token（确保配置完整）
            (0, config_1.saveAuthCode)(response.code);
            (0, config_1.saveToken)(config_1.DEFAULT_BEARER_TOKEN);
            (0, http_1.outputJSON)({
                ok: true,
                message: '用户授权流程已发起，授权码已保存到本地配置',
                authCode: response.code,
                authUrl: response.authUrl,
                instructions: [
                    '步骤 1（已完成）: CLI 已获取授权码',
                    '步骤 2: 【用户手动操作】在浏览器中访问上面的 authUrl，完成登录授权',
                    '步骤 3: 在 CLI 中执行: lbp-growth-calendar auth verify ' + response.code,
                ],
                warning: '步骤 2 必须由用户手动在浏览器中完成，Agent 绝对不能自动调用浏览器或尝试自动化登录流程。',
                note: `授权码已保存。完成步骤 2 后执行 verify 即可获取 API Key。`,
            });
        }
        catch (error) {
            (0, http_1.outputError)(`授权流程异常: ${error instanceof Error ? error.message : String(error)}。建议检查网络连接后重试。`, 'AUTH_INIT_FAILED');
        }
    });
    // auth verify [code] - 用 authCode 换取 API Key，或验证已有 API Key
    auth
        .command('verify [code]')
        .description('用授权码换取 API Key，或验证已有 API Key 是否有效')
        .option('--api-key <key>', '要验证的 API Key（与 code 二选一）')
        .action(async (code, opts) => {
        try {
            // 校验规则：code 和 --api-key 二选一，不能同时传，也不能都不传
            const hasCode = !!code;
            const hasApiKeyOption = !!opts.apiKey;
            if (hasCode && hasApiKeyOption) {
                (0, http_1.outputError)(`不能同时提供 code 和 --api-key 参数，请选择其中一种方式。`, 'INVALID_PARAMS');
                return;
            }
            if (!hasCode && !hasApiKeyOption) {
                (0, http_1.outputError)(`需要提供 code 或 --api-key 参数之一。用法：\n1. auth verify <code> - 用授权码查询授权状态\n2. auth verify --api-key <key> - 验证 API Key 是否有效`, 'MISSING_PARAMS');
                return;
            }
            // 模式 1: 携带 code - 用 code 查询授权状态，返回 token 颁发结果
            if (hasCode) {
                // 使用内置的 Bearer Token 调用 verify 接口
                const { status, data } = await (0, http_1.apiRequestWithBearer)('POST', '/openapi/agent-auth/verify', config_1.DEFAULT_BEARER_TOKEN, { code });
                if (status === 404) {
                    (0, http_1.outputError)(`无效的授权码: ${code}。可能原因：1) 授权码已过期，请重新执行 auth init；2) 授权码输入错误；3) 用户未在浏览器中完成授权。`, 'INVALID_AUTH_CODE');
                    return;
                }
                if (status === 401 || status === 403) {
                    // 错误详情由 http.ts 中的 checkAuthError 处理
                    return;
                }
                if (status !== 200) {
                    (0, http_1.outputError)(`验证授权码失败: HTTP ${status}。建议：1) 检查网络连接；2) 稍后重试。`, 'AUTH_VERIFY_FAILED');
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
                            '2. 确认使用的是最新的授权码（重新执行 auth init 可获取新授权码）',
                        ],
                    });
                    return;
                }
                if (response.status === 'expired') {
                    (0, http_1.outputJSON)({
                        ok: false,
                        error: 'AUTH_EXPIRED',
                        message: `授权码已过期。请重新执行 auth init 获取新的授权码。`,
                        status: response.status,
                        suggestion: [
                            '1. 执行 lbp-growth-calendar auth init 获取新的授权码',
                            '2. 在浏览器中尽快完成授权',
                        ],
                    });
                    return;
                }
                if (response.status === 'completed' && response.token) {
                    // 保存 API Key
                    (0, config_1.saveApiKey)(response.token);
                    (0, http_1.outputJSON)({
                        ok: true,
                        message: '授权成功！API Key 已保存',
                        user: {
                            userId: response.userId,
                            userName: response.userName,
                        },
                        expiresAt: response.expiresAt,
                        configFile: (0, config_1.configFilePath)(),
                        note: `API Key（动态，过期时间见 expiresAt）已保存。现在可以访问业务接口了。`,
                    });
                    return;
                }
                (0, http_1.outputError)(`未知的授权状态: ${response.status}。建议重新执行 auth init 流程。`, 'UNKNOWN_AUTH_STATUS');
                return;
            }
            // 模式 2: 携带 x-api-key - 验证已有 token 是否有效
            if (hasApiKeyOption) {
                const apiKey = opts.apiKey;
                // 调用 verify 接口，只传 x-api-key header，不传 body
                const { status, data } = await (0, http_1.apiRequestWithApiKey)('POST', '/openapi/agent-auth/verify', apiKey);
                if (status === 400) {
                    const response = data;
                    (0, http_1.outputError)(`请求参数错误: ${response.message || '请检查 API Key 格式'}`, 'BAD_REQUEST');
                    return;
                }
                if (status !== 200) {
                    (0, http_1.outputError)(`验证 API Key 失败: HTTP ${status}。建议：1) 检查网络连接；2) 稍后重试。`, 'API_KEY_VERIFY_FAILED');
                    return;
                }
                const response = data;
                if (response.status === 'valid') {
                    (0, http_1.outputJSON)({
                        ok: true,
                        status: 'valid',
                        message: 'API Key 有效',
                        user: {
                            userId: response.userId,
                            userName: response.userName,
                        },
                        expiresAt: response.expiresAt,
                        isAdmin: response.isAdmin,
                    });
                    return;
                }
                if (response.status === 'invalid') {
                    (0, http_1.outputJSON)({
                        ok: false,
                        status: 'invalid',
                        error: 'API_KEY_INVALID',
                        message: `API Key 无效: ${response.reason || '未知原因'}`,
                        reason: response.reason,
                        suggestion: [
                            '1. 检查 API Key 是否正确',
                            '2. 如已过期，请重新执行 auth init -> verify 流程',
                        ],
                    });
                    return;
                }
                (0, http_1.outputError)(`未知的验证状态: ${response.status}。建议重新执行验证流程。`, 'UNKNOWN_VERIFY_STATUS');
            }
        }
        catch (error) {
            (0, http_1.outputError)(`验证异常: ${error instanceof Error ? error.message : String(error)}。建议检查网络连接后重试。`, 'AUTH_VERIFY_FAILED');
        }
    });
    // auth status
    auth
        .command('status')
        .description('查看当前认证配置状态')
        .action(() => {
        const apiKey = (0, config_1.getApiKey)();
        const authCode = (0, config_1.getAuthCode)();
        if (apiKey) {
            (0, http_1.outputJSON)({
                ok: true,
                configured: true,
                bearerToken: {
                    configured: true,
                    type: '内置（长期有效）',
                },
                apiKey: {
                    configured: true,
                    preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
                    type: '动态值（有过期时间）',
                },
                authCode: authCode || '已使用或过期',
                message: '用户授权完成，可以访问所有接口',
                configFile: (0, config_1.configFilePath)(),
            });
        }
        else if (authCode) {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                bearerToken: {
                    configured: true,
                    type: '内置（长期有效）',
                },
                apiKey: {
                    configured: false,
                    message: '未完成 verify 步骤',
                },
                authCode: authCode,
                message: `用户尚未完成浏览器授权。请执行 auth verify ${authCode} 完成授权。`,
                suggestion: [
                    '1. 确认已在浏览器中完成授权',
                    `2. 执行: lbp-growth-calendar auth verify ${authCode}`,
                    '3. 如丢失授权码，重新执行 auth init 获取新的授权码',
                ],
            });
        }
        else {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                bearerToken: {
                    configured: true,
                    type: '内置（长期有效）',
                },
                apiKey: { configured: false },
                authCode: null,
                message: `尚未完成用户授权。`,
                setupInstructions: [
                    '步骤 1: lbp-growth-calendar auth init',
                    '步骤 2: 在浏览器中访问输出的 authUrl 完成授权',
                    '步骤 3: lbp-growth-calendar auth verify <auth-code>',
                ],
                configFile: (0, config_1.configFilePath)(),
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
            message: '所有认证信息已清除。如需重新授权，请执行 auth init',
        });
    });
}
//# sourceMappingURL=auth.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_URL = void 0;
exports.getRequestOptions = getRequestOptions;
exports.apiRequest = apiRequest;
exports.apiRequestWithBearer = apiRequestWithBearer;
exports.outputJSON = outputJSON;
exports.outputSuccess = outputSuccess;
exports.outputError = outputError;
exports.handleApiResponse = handleApiResponse;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("./config");
exports.BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';
// 联系人信息
const CONTACT_INFO = '请联系 jg（俊奇）';
function getRequestOptions() {
    const bearerToken = (0, config_1.getBearerToken)();
    const apiKey = (0, config_1.getApiKey)();
    return { bearerToken, apiKey };
}
/**
 * 全局检查 API 响应中的认证错误
 * 提供 AI 友好的错误提示，包含明确的操作指引
 */
function checkAuthError(data, status) {
    // 401/403 错误处理
    if (status === 401 || status === 403) {
        const d = data;
        const message = d?.message || '';
        const errorType = status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN';
        const errorTitle = status === 401 ? '认证失败' : '禁止访问';
        const errorReason = status === 401
            ? 'Token 无效、已过期或未提供'
            : '当前 Token 没有权限访问此接口';
        console.error(JSON.stringify({
            ok: false,
            error: errorType,
            title: errorTitle,
            reason: errorReason,
            details: message,
            suggestion: [
                `1. 确认 Bearer Token 正确且未过期（${CONTACT_INFO}获取）`,
                '2. 确认 API Key 未过期（如过期需重新执行 verify）',
                '3. 确认 Token 有访问该接口的权限',
                `4. 如问题持续，${CONTACT_INFO}技术支持`,
            ],
            quickFix: '执行 lbp-growth-calendar auth status 检查 Token 状态',
        }, null, 2));
        process.exit(1);
    }
}
/**
 * 检查是否已配置认证
 */
function checkAuthConfigured() {
    const bearerToken = (0, config_1.getBearerToken)();
    const apiKey = (0, config_1.getApiKey)();
    if (!bearerToken && !apiKey) {
        console.error(JSON.stringify({
            ok: false,
            error: 'NOT_CONFIGURED',
            title: '未配置认证信息',
            reason: '本地未找到 Bearer Token 和 API Key',
            suggestion: [
                `1. 获取 Bearer Token（${CONTACT_INFO}）`,
                '2. 执行: lbp-growth-calendar auth init --bearer-token <token>',
                '3. 在浏览器中完成授权',
                '4. 执行: lbp-growth-calendar auth verify <code>',
            ],
            quickCheck: '执行 lbp-growth-calendar auth status 查看当前配置',
        }, null, 2));
        process.exit(1);
    }
    if (bearerToken && !apiKey) {
        console.error(JSON.stringify({
            ok: false,
            error: 'API_KEY_MISSING',
            title: '缺少 API Key',
            reason: 'Bearer Token 已配置，但 API Key 未获取（verify 步骤未完成）',
            suggestion: [
                '1. 确认已在浏览器中完成授权',
                '2. 获取授权码并执行: lbp-growth-calendar auth verify <code>',
                '3. 如丢失授权码，需重新执行 init 步骤',
                `4. 需要帮助，${CONTACT_INFO}技术支持`,
            ],
            quickCheck: '执行 lbp-growth-calendar auth status 查看当前配置',
        }, null, 2));
        process.exit(1);
    }
}
async function apiRequest(method, path, options, body) {
    const url = `${exports.BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    // 始终携带 Bearer Token（用于基础认证）
    headers['Authorization'] = `Bearer ${options.bearerToken}`;
    // 如果有 API Key，同时携带 x-api-key（用于业务接口权限）
    if (options.apiKey) {
        headers['x-api-key'] = options.apiKey;
    }
    const fetchOptions = {
        method,
        headers,
    };
    if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
    }
    const response = await (0, node_fetch_1.default)(url, fetchOptions);
    const data = await response.json();
    // 全局认证错误拦截
    checkAuthError(data, response.status);
    return { status: response.status, data };
}
/**
 * 使用指定 Bearer Token 调用 API（用于 init 和 verify）
 */
async function apiRequestWithBearer(method, path, bearerToken, body) {
    const url = `${exports.BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
    };
    const fetchOptions = {
        method,
        headers,
    };
    if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
    }
    const response = await (0, node_fetch_1.default)(url, fetchOptions);
    const data = await response.json();
    // 检查和报告错误
    if (response.status === 401 || response.status === 403) {
        const errorType = response.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN';
        const message = data?.message || '';
        console.error(JSON.stringify({
            ok: false,
            error: errorType,
            title: response.status === 401 ? '认证失败' : '禁止访问',
            reason: 'Bearer Token 无效或没有权限访问 init/verify 接口',
            details: message,
            suggestion: [
                `1. 确认 Bearer Token 正确（${CONTACT_INFO}获取）`,
                '2. 确认 Token 未过期',
                '3. 确认 Token 有访问 init/verify 接口的权限',
                `4. 如问题持续，${CONTACT_INFO}技术支持`,
            ],
        }, null, 2));
        process.exit(1);
    }
    return { status: response.status, data };
}
function outputJSON(data) {
    console.log(JSON.stringify(data, null, 2));
}
function outputSuccess(data) {
    outputJSON({ ok: true, data });
}
function outputError(message, code = 'REQUEST_FAILED', exitCode = 1) {
    outputJSON({
        ok: false,
        error: code,
        message,
    });
    process.exit(exitCode);
    throw new Error('unreachable');
}
function handleApiResponse(status, data, expectedStatus = 200) {
    if (status === expectedStatus) {
        outputSuccess(data);
    }
    else if (status === 404) {
        outputError(data?.message || '资源不存在', 'NOT_FOUND', 1);
    }
    else {
        const apiError = data?.message || '';
        outputError(`API 返回状态码 ${status}: ${apiError || JSON.stringify(data)}。${CONTACT_INFO}技术支持。`, 'API_ERROR', 1);
    }
}
//# sourceMappingURL=http.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_URL = void 0;
exports.getRequestOptions = getRequestOptions;
exports.apiRequest = apiRequest;
exports.outputJSON = outputJSON;
exports.outputSuccess = outputSuccess;
exports.outputError = outputError;
exports.handleApiResponse = handleApiResponse;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("./config");
exports.BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';
function getRequestOptions() {
    const token = (0, config_1.getToken)();
    if (!token) {
        outputError([
            '缺少 Bearer Token。',
            `请通过以下任一方式配置：`,
            `1. 执行 lbp-growth-calendar auth save <token>`,
            `2. 设置环境变量 ${(0, config_1.getTokenEnvKey)()}`,
            `3. 本次命令追加 --token <token>`,
        ].join('\n'), 'MISSING_BEARER_TOKEN');
    }
    return { token };
}
function checkAuthError(data, status) {
    if (status !== 401 && status !== 403)
        return;
    const d = data;
    const errorType = status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN';
    const errorTitle = status === 401 ? '认证失败' : '禁止访问';
    const errorReason = status === 401
        ? 'Bearer Token 无效、已过期或未提供'
        : '当前 Bearer Token 没有权限访问此接口';
    console.log(JSON.stringify({
        ok: false,
        error: errorType,
        title: errorTitle,
        reason: errorReason,
        details: d?.message || '',
        suggestion: [
            '1. 执行 lbp-growth-calendar auth status 检查当前 Token 配置状态',
            '2. 确认 Token 正确且未过期',
            '3. 如仍失败，请联系管理员获取新的 Token',
        ],
    }, null, 2));
    process.exit(1);
}
async function apiRequest(method, path, options, body) {
    const url = `${exports.BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.token}`,
    };
    const fetchOptions = {
        method,
        headers,
    };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(body);
    }
    const response = await (0, node_fetch_1.default)(url, fetchOptions);
    const data = await response.json();
    checkAuthError(data, response.status);
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
        return;
    }
    if (status === 404) {
        outputError(data?.message || '资源不存在', 'NOT_FOUND', 1);
    }
    const apiError = data?.message || '';
    outputError(`API 返回状态码 ${status}: ${apiError || JSON.stringify(data)}。建议稍后重试。`, 'API_ERROR', 1);
}
//# sourceMappingURL=http.js.map
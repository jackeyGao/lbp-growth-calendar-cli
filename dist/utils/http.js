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
function getRequestOptions() {
    const bearerToken = (0, config_1.getBearerToken)();
    const apiKey = (0, config_1.getApiKey)();
    return { bearerToken, apiKey };
}
/**
 * 全局检查 API 响应中的认证错误
 * - token 失效或无效
 * - 未配置 token
 */
function checkAuthError(data, status) {
    // 401/403 错误处理
    if (status === 401 || status === 403) {
        const d = data;
        const message = d?.message || '';
        console.error(JSON.stringify({
            ok: false,
            error: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
            message: status === 401
                ? '认证失败：Token 无效或已过期。请检查 bearer token 是否正确，并重新执行授权流程。'
                : '禁止访问：没有权限调用此接口。请确认 bearer token 有权限访问 init/verify 接口。',
            details: message,
            suggestion: [
                '1. 确认 bearer token 正确：lbp-growth-calendar auth init --bearer-token <your-token>',
                '2. 重新执行授权流程',
                '3. 联系管理员确认 token 权限',
            ],
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
    // 检查认证错误
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
    }
    else if (status === 404) {
        outputError(data?.message || '资源不存在', 'NOT_FOUND', 1);
    }
    else {
        outputError(`API 返回状态码 ${status}: ${JSON.stringify(data)}`, 'API_ERROR', 1);
    }
}
//# sourceMappingURL=http.js.map
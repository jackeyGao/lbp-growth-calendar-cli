"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_URL = void 0;
exports.getRequestOptions = getRequestOptions;
exports.apiRequest = apiRequest;
exports.apiRequestNoAuth = apiRequestNoAuth;
exports.outputJSON = outputJSON;
exports.outputSuccess = outputSuccess;
exports.outputError = outputError;
exports.handleApiResponse = handleApiResponse;
const node_fetch_1 = __importDefault(require("node-fetch"));
const config_1 = require("./config");
exports.BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';
function getRequestOptions() {
    const token = process.env.LBP_GROWTH_CALENDAR_TOKEN || (0, config_1.getToken)();
    return { token };
}
/**
 * 全局检查 API 响应中的认证错误
 * - token 失效或无效
 * - 未配置 token
 */
function checkAuthError(data) {
    if (data && typeof data === 'object') {
        const d = data;
        const statusCode = d.statusCode;
        const message = d.message || '';
        // 401 未授权或 token 无效
        if (statusCode === 401) {
            console.error(JSON.stringify({
                ok: false,
                error: 'TOKEN_INVALID',
                message: 'Token 已失效或未授权，请重新执行授权流程：\n  1. lbp-growth-calendar auth init\n  2. 在浏览器中完成授权\n  3. lbp-growth-calendar auth verify <auth-code>',
            }, null, 2));
            process.exit(1);
        }
        // 403 禁止访问
        if (statusCode === 403) {
            console.error(JSON.stringify({
                ok: false,
                error: 'FORBIDDEN',
                message: '没有权限访问该资源',
            }, null, 2));
            process.exit(1);
        }
    }
}
async function apiRequest(method, path, options, body) {
    const url = `${exports.BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    // 使用 x-api-key 而不是 Authorization: Bearer
    if (options.token) {
        headers['x-api-key'] = options.token;
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
    checkAuthError(data);
    return { status: response.status, data };
}
/**
 * 无需认证的 API 请求（用于 init 和 verify）
 */
async function apiRequestNoAuth(method, path, body) {
    const url = `${exports.BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
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
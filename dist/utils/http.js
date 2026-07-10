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
    const token = process.env.LBP_GROWTH_CALENDAR_TOKEN || (0, config_1.getToken)();
    return { token };
}
/**
 * 全局检查 API 响应中的认证错误
 * - api key not found or invalid → token 失效
 * - missing or invalid Authorization header → 未配置 token
 */
function checkAuthError(data) {
    if (data && typeof data === 'object') {
        const d = data;
        const errMsg = d.error_msg || '';
        if (d.status_code === 'k_ec_000015') {
            if (errMsg.includes('api key not found or invalid')) {
                console.error(JSON.stringify({
                    ok: false,
                    error: 'TOKEN_INVALID',
                    message: 'Token 已失效，请重新获取 Token 并保存。\n  Token 可以找 jg 要，获取后执行：lbp-growth-calendar auth save --token <your-token>',
                }, null, 2));
                process.exit(1);
            }
            if (errMsg.includes('missing or invalid Authorization header')) {
                console.error(JSON.stringify({
                    ok: false,
                    error: 'TOKEN_MISSING',
                    message: '未配置 Token，请先获取并保存 Token。\n  Token 可以找 jg 要，获取后执行：lbp-growth-calendar auth save --token <your-token>',
                }, null, 2));
                process.exit(1);
            }
        }
    }
}
async function apiRequest(method, path, options, body) {
    const url = `${exports.BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
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
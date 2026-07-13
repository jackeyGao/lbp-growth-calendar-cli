import fetch from 'node-fetch';
import { getToken, getApiKey } from './config';

export const BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';

// 兜底联系人（仅用于极少数无法自助解决的场景）
const ESCALATION_CONTACT = '如上述方案无法解决，请联系 jg（俊奇）';

export interface RequestOptions {
  token: string;
  apiKey?: string;
}

export function getRequestOptions(): RequestOptions {
  const token = getToken();
  const apiKey = getApiKey();
  return { token, apiKey };
}

/**
 * 全局检查 API 响应中的认证错误
 * 提供 AI 友好的错误提示，包含明确的操作指引
 */
function checkAuthError(data: unknown, status: number): void {
  // 401/403 错误处理
  if (status === 401 || status === 403) {
    const d = data as Record<string, unknown>;
    const message = (d?.message as string) || '';

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
        '1. 执行 lbp-growth-calendar auth status 检查认证状态',
        '2. 如 API Key 过期，重新执行 auth init -> verify 流程',
        '3. 确认已完成用户授权流程',
        `4. ${ESCALATION_CONTACT}`,
      ],
      quickFix: '执行 lbp-growth-calendar auth init 重新发起授权',
    }, null, 2));
    process.exit(1);
  }
}

/**
 * 检查是否已配置认证
 */
function checkAuthConfigured(): void {
  const token = getToken();
  const apiKey = getApiKey();

  if (!token && !apiKey) {
    console.error(JSON.stringify({
      ok: false,
      error: 'NOT_CONFIGURED',
      title: '未配置认证信息',
      reason: '本地未找到 API Key',
      suggestion: [
        '1. 执行: lbp-growth-calendar auth init',
        '2. 在浏览器中完成授权',
        '3. 执行: lbp-growth-calendar auth verify <code>',
      ],
      quickCheck: '执行 lbp-growth-calendar auth status 查看当前配置',
    }, null, 2));
    process.exit(1);
  }

  if (token && !apiKey) {
    console.error(JSON.stringify({
      ok: false,
      error: 'API_KEY_MISSING',
      title: '缺少 API Key',
      reason: '用户授权未完成（verify 步骤未完成）',
      suggestion: [
        '1. 确认已在浏览器中完成授权',
        '2. 执行: lbp-growth-calendar auth verify <code>',
        '3. 如丢失授权码，重新执行 auth init 获取新的授权码',
      ],
      quickCheck: '执行 lbp-growth-calendar auth status 查看当前配置',
    }, null, 2));
    process.exit(1);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  options: RequestOptions,
  body?: Record<string, unknown>
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 始终携带 Token（用于基础认证，即 Bearer Token）
  headers['Authorization'] = `Bearer ${options.token}`;

  // 如果有 API Key，同时携带 x-api-key（用于业务接口权限）
  if (options.apiKey) {
    headers['x-api-key'] = options.apiKey;
  }

  const fetchOptions: Record<string, unknown> = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions as Parameters<typeof fetch>[1]);
  const data = await response.json();

  // 全局认证错误拦截
  checkAuthError(data, response.status);

  return { status: response.status, data };
}

/**
 * 使用指定 Token 调用 API（用于 init 和 verify）
 */
export async function apiRequestWithBearer(
  method: string,
  path: string,
  token: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const fetchOptions: Record<string, unknown> = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions as Parameters<typeof fetch>[1]);
  const data = await response.json();

  // 检查和报告错误
  if (response.status === 401 || response.status === 403) {
    const errorType = response.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN';
    const message = (data as Record<string, unknown>)?.message as string || '';

    console.error(JSON.stringify({
      ok: false,
      error: errorType,
      title: response.status === 401 ? '认证失败' : '禁止访问',
      reason: '内置 Token 无效或没有权限访问 init/verify 接口',
      details: message,
      suggestion: [
        '1. 检查 CLI 是否为最新版本（npm update -g lbp-growth-calendar）',
        '2. 稍后重试',
        `3. ${ESCALATION_CONTACT}`,
      ],
    }, null, 2));
    process.exit(1);
  }

  return { status: response.status, data };
}

/**
 * 使用 x-api-key header 调用 API（用于验证 API Key 有效性）
 */
export async function apiRequestWithApiKey(
  method: string,
  path: string,
  apiKey: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };

  const fetchOptions: Record<string, unknown> = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions as Parameters<typeof fetch>[1]);
  const data = await response.json();

  return { status: response.status, data };
}

export function outputJSON(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function outputSuccess(data: unknown): void {
  outputJSON({ ok: true, data });
}

export function outputError(message: string, code: string = 'REQUEST_FAILED', exitCode: number = 1): never {
  outputJSON({
    ok: false,
    error: code,
    message,
  });
  process.exit(exitCode);
  throw new Error('unreachable');
}

export function handleApiResponse(status: number, data: unknown, expectedStatus: number = 200): void {
  if (status === expectedStatus) {
    outputSuccess(data);
  } else if (status === 404) {
    outputError(
      (data as Record<string, unknown>)?.message as string || '资源不存在',
      'NOT_FOUND',
      1
    );
  } else {
    const apiError = (data as Record<string, unknown>)?.message as string || '';
    outputError(
      `API 返回状态码 ${status}: ${apiError || JSON.stringify(data)}。建议稍后重试。`,
      'API_ERROR',
      1
    );
  }
}

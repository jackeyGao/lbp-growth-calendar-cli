import fetch from 'node-fetch';
import { getBearerToken, getApiKey } from './config';

export const BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';

export interface RequestOptions {
  bearerToken: string;
  apiKey?: string;
}

export function getRequestOptions(): RequestOptions {
  const bearerToken = getBearerToken();
  const apiKey = getApiKey();
  return { bearerToken, apiKey };
}

/**
 * 全局检查 API 响应中的认证错误
 * - token 失效或无效
 * - 未配置 token
 */
function checkAuthError(data: unknown, status: number): void {
  // 401/403 错误处理
  if (status === 401 || status === 403) {
    const d = data as Record<string, unknown>;
    const message = (d?.message as string) || '';

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

  // 始终携带 Bearer Token（用于基础认证）
  headers['Authorization'] = `Bearer ${options.bearerToken}`;

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
 * 使用指定 Bearer Token 调用 API（用于 init 和 verify）
 */
export async function apiRequestWithBearer(
  method: string,
  path: string,
  bearerToken: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bearerToken}`,
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

  // 检查认证错误
  checkAuthError(data, response.status);

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
    outputError(
      `API 返回状态码 ${status}: ${JSON.stringify(data)}`,
      'API_ERROR',
      1
    );
  }
}

import fetch from 'node-fetch';
import { getToken } from './config';

export const BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';

export interface RequestOptions {
  token: string;
}

export function getRequestOptions(): RequestOptions {
  const token = process.env.LBP_GROWTH_CALENDAR_TOKEN || getToken();
  return { token };
}

/**
 * 全局检查 API 响应中的认证错误
 * - token 失效或无效
 * - 未配置 token
 */
function checkAuthError(data: unknown): void {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const statusCode = d.statusCode as number;
    const message = (d.message as string) || '';

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

  // 使用 x-api-key 而不是 Authorization: Bearer
  if (options.token) {
    headers['x-api-key'] = options.token;
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
  checkAuthError(data);

  return { status: response.status, data };
}

/**
 * 无需认证的 API 请求（用于 init 和 verify）
 */
export async function apiRequestNoAuth(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
    outputError(
      `API 返回状态码 ${status}: ${JSON.stringify(data)}`,
      'API_ERROR',
      1
    );
  }
}

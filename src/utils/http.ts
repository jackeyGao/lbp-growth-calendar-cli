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
 * - api key not found or invalid → token 失效
 * - missing or invalid Authorization header → 未配置 token
 */
function checkAuthError(data: unknown): void {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const errMsg = (d.error_msg as string) || '';
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

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
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

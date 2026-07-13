import fetch from 'node-fetch';
import { getToken, getTokenEnvKey } from './config';

export const BASE_URL = 'https://bytedance.aiforce.cloud/app/app_179t4b8e4mv';

export interface RequestOptions {
  token: string;
}

export function getRequestOptions(): RequestOptions {
  const token = getToken();
  if (!token) {
    outputError(
      [
        '缺少 Bearer Token。',
        `请通过以下任一方式配置：`,
        `1. 执行 lbp-growth-calendar auth save <token>`,
        `2. 设置环境变量 ${getTokenEnvKey()}`,
        `3. 本次命令追加 --token <token>`,
      ].join('\n'),
      'MISSING_BEARER_TOKEN'
    );
  }
  return { token };
}

function checkAuthError(data: unknown, status: number): void {
  if (status !== 401 && status !== 403) return;

  const d = data as Record<string, unknown>;
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
    details: (d?.message as string) || '',
    suggestion: [
      '1. 执行 lbp-growth-calendar auth status 检查当前 Token 配置状态',
      '2. 确认 Token 正确且未过期',
      '3. 如仍失败，请联系管理员获取新的 Token',
    ],
  }, null, 2));
  process.exit(1);
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
    'Authorization': `Bearer ${options.token}`,
  };

  const fetchOptions: Record<string, unknown> = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions as Parameters<typeof fetch>[1]);
  const data = await response.json();

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
    return;
  }

  if (status === 404) {
    outputError(
      (data as Record<string, unknown>)?.message as string || '资源不存在',
      'NOT_FOUND',
      1
    );
  }

  const apiError = (data as Record<string, unknown>)?.message as string || '';
  outputError(
    `API 返回状态码 ${status}: ${apiError || JSON.stringify(data)}。建议稍后重试。`,
    'API_ERROR',
    1
  );
}

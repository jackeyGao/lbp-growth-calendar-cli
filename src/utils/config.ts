import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.lbp-growth-calendar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 内置的 Bearer Token，用于访问 init 和 verify 接口
export const BUILT_IN_BEARER_TOKEN = '550e8400-e29b-41d4-a716-446655440000';

export interface Config {
  bearerToken?: string;  // 内置 Bearer Token（用于所有请求的基础认证）
  apiKey?: string;       // 用户通过 verify 获取的 API Key（用于业务接口）
}

export function readConfig(): Config {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

export function writeConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * 保存 Bearer Token（内置 token）
 */
export function saveBearerToken(token: string): void {
  const config = readConfig();
  config.bearerToken = token;
  writeConfig(config);
}

/**
 * 保存 API Key（用户通过 verify 获取的 token）
 */
export function saveApiKey(apiKey: string): void {
  const config = readConfig();
  config.apiKey = apiKey;
  writeConfig(config);
}

/**
 * 同时保存 Bearer Token 和 API Key
 */
export function saveTokens(bearerToken: string, apiKey: string): void {
  const config = readConfig();
  config.bearerToken = bearerToken;
  config.apiKey = apiKey;
  writeConfig(config);
}

/**
 * 清除所有 Token
 */
export function clearTokens(): void {
  const config = readConfig();
  delete config.bearerToken;
  delete config.apiKey;
  writeConfig(config);
}

/**
 * 获取 Bearer Token（优先从配置读取，否则返回内置 token）
 */
export function getBearerToken(): string {
  const config = readConfig();
  return config.bearerToken || BUILT_IN_BEARER_TOKEN;
}

/**
 * 获取 API Key
 */
export function getApiKey(): string {
  const config = readConfig();
  return config.apiKey || '';
}

/**
 * 检查是否已完成授权（有 API Key）
 */
export function isAuthorized(): boolean {
  const config = readConfig();
  return !!config.apiKey;
}

export function configFilePath(): string {
  return CONFIG_FILE;
}

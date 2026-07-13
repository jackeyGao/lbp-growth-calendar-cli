import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.lbp-growth-calendar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// 内置的默认 Bearer Token（Agent 级别，用于访问 init/verify 接口）
export const DEFAULT_BEARER_TOKEN = 'e548uqkSvCZ_EtfcwL5ZIIoEiNVEI3Ws0-xpAaRlkDg';

export interface Config {
  authCode?: string;     // 通过 init 获取的授权码（临时，用于 verify）
  token?: string;        // 用户提供的固定 Token（Bearer Token，用于 init/verify 接口）
  apiKey?: string;       // 通过 verify 获取的动态 API Key（用于业务接口）
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
 * 保存授权码（init 获取）
 */
export function saveAuthCode(authCode: string): void {
  const config = readConfig();
  config.authCode = authCode;
  writeConfig(config);
}

/**
 * 获取授权码
 */
export function getAuthCode(): string {
  const config = readConfig();
  return config.authCode || '';
}

/**
 * 保存 Token（用户提供，等同于 Bearer Token）
 */
export function saveToken(token: string): void {
  const config = readConfig();
  config.token = token;
  writeConfig(config);
}

/**
 * 获取 Token（Bearer Token）
 */
export function getToken(): string {
  const config = readConfig();
  return config.token || '';
}

/**
 * 保存 API Key（通过 verify 获取）
 */
export function saveApiKey(apiKey: string): void {
  const config = readConfig();
  config.apiKey = apiKey;
  writeConfig(config);
}

/**
 * 获取 API Key
 */
export function getApiKey(): string {
  const config = readConfig();
  return config.apiKey || '';
}

/**
 * 同时保存 Token 和 API Key
 */
export function saveAuth(token: string, apiKey: string): void {
  const config = readConfig();
  config.token = token;
  config.apiKey = apiKey;
  writeConfig(config);
}

/**
 * 清除所有认证信息
 */
export function clearAuth(): void {
  const config = readConfig();
  delete config.authCode;
  delete config.token;
  delete config.apiKey;
  writeConfig(config);
}

/**
 * 检查是否已完成授权（有 API Key）
 */
export function isAuthorized(): boolean {
  const config = readConfig();
  return !!config.apiKey;
}

/**
 * 检查是否有 Token
 */
export function hasToken(): boolean {
  const config = readConfig();
  return !!config.token;
}

export function configFilePath(): string {
  return CONFIG_FILE;
}

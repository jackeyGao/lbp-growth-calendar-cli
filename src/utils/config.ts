import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.lbp-growth-calendar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const TOKEN_ENV_KEY = 'LBP_GROWTH_CALENDAR_TOKEN';

let runtimeToken: string | undefined;

export interface Config {
  token?: string;
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

export function saveToken(token: string): void {
  const normalized = token.trim();
  if (!normalized) {
    clearAuth();
    return;
  }
  writeConfig({ token: normalized });
}

export function clearAuth(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.rmSync(CONFIG_FILE, { force: true });
  }
}

export function getSavedToken(): string {
  const config = readConfig();
  return config.token || '';
}

export function setRuntimeToken(token: string | undefined): void {
  runtimeToken = token?.trim() || undefined;
}

export function getToken(): string {
  if (runtimeToken) return runtimeToken;

  const envToken = process.env[TOKEN_ENV_KEY]?.trim();
  if (envToken) return envToken;

  return getSavedToken();
}

export function hasToken(): boolean {
  return !!getToken();
}

export function configFilePath(): string {
  return CONFIG_FILE;
}

export function getTokenEnvKey(): string {
  return TOKEN_ENV_KEY;
}

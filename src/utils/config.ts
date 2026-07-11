import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.lbp-growth-calendar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

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
  const config = readConfig();
  config.token = token;
  writeConfig(config);
}

export function clearToken(): void {
  const config = readConfig();
  delete config.token;
  writeConfig(config);
}

export function getToken(): string {
  const config = readConfig();
  return config.token || '';
}

export function configFilePath(): string {
  return CONFIG_FILE;
}

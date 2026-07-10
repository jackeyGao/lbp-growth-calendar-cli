import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// We need to mock the config module path before importing
const TEST_CONFIG_DIR = path.join(os.tmpdir(), `.lbp-growth-calendar-test-${Date.now()}`);
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json');

// Monkey-patch os.homedir for config module isolation
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => path.join(require('os').tmpdir(), `lbp-test-home-${process.env.JEST_WORKER_ID || '0'}`),
}));

import { readConfig, writeConfig, saveToken, getToken, configFilePath } from '../../utils/config';

describe('config utils', () => {
  afterEach(() => {
    // Clean up config dir after each test
    try {
      const cfgFile = configFilePath();
      const cfgDir = path.dirname(cfgFile);
      if (fs.existsSync(cfgFile)) fs.rmSync(cfgFile);
      if (fs.existsSync(cfgDir)) fs.rmdirSync(cfgDir, { recursive: true } as fs.RmDirOptions);
    } catch {
      // ignore
    }
  });

  test('readConfig returns empty object when no file', () => {
    const cfg = readConfig();
    expect(cfg).toEqual({});
  });

  test('saveToken and getToken roundtrip', () => {
    saveToken('test-token-abc');
    expect(getToken()).toBe('test-token-abc');
  });

  test('writeConfig and readConfig roundtrip', () => {
    writeConfig({ token: 'hello-token' });
    const cfg = readConfig();
    expect(cfg.token).toBe('hello-token');
  });

  test('configFilePath ends with config.json', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
  });

  test('saveToken overwrites previous token', () => {
    saveToken('first-token');
    saveToken('second-token');
    expect(getToken()).toBe('second-token');
  });

  test('saveToken with empty string clears token', () => {
    saveToken('some-token');
    saveToken('');
    expect(getToken()).toBe('');
  });
});

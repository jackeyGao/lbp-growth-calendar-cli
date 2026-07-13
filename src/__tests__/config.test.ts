import * as fs from 'fs';
import * as path from 'path';

jest.mock('os', () => {
  const actual = jest.requireActual('os');
  return {
    ...actual,
    homedir: () => path.join(actual.tmpdir(), `lbp-test-home-${process.env.JEST_WORKER_ID || '0'}`),
  };
});

import {
  readConfig,
  writeConfig,
  saveToken,
  getToken,
  getSavedToken,
  setRuntimeToken,
  configFilePath,
  getTokenEnvKey,
} from '../utils/config';

describe('config utils', () => {
  afterEach(() => {
    setRuntimeToken(undefined);
    delete process.env[getTokenEnvKey()];

    try {
      const cfgFile = configFilePath();
      const cfgDir = path.dirname(cfgFile);
      if (fs.existsSync(cfgFile)) fs.rmSync(cfgFile, { force: true });
      if (fs.existsSync(cfgDir)) fs.rmSync(cfgDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('readConfig returns empty object when no file', () => {
    expect(readConfig()).toEqual({});
  });

  test('saveToken and getSavedToken roundtrip', () => {
    saveToken('test-token-abc');
    expect(getSavedToken()).toBe('test-token-abc');
  });

  test('writeConfig and readConfig roundtrip', () => {
    writeConfig({ token: 'hello-token' });
    expect(readConfig().token).toBe('hello-token');
  });

  test('configFilePath ends with config.json', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
  });

  test('runtime token has highest priority', () => {
    saveToken('saved-token');
    process.env[getTokenEnvKey()] = 'env-token';
    setRuntimeToken('runtime-token');
    expect(getToken()).toBe('runtime-token');
  });

  test('env token overrides saved token', () => {
    saveToken('saved-token');
    process.env[getTokenEnvKey()] = 'env-token';
    expect(getToken()).toBe('env-token');
  });
});

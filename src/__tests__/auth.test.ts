// Integration-style tests for the auth command
jest.mock('../utils/config', () => {
  const store: Record<string, string> = {};
  return {
    saveAuthCode: jest.fn((c: string) => { store['authCode'] = c; }),
    saveToken: jest.fn((t: string) => { store['token'] = t; }),
    saveApiKey: jest.fn((k: string) => { store['apiKey'] = k; }),
    saveAuth: jest.fn((t: string, k: string) => {
      store['token'] = t;
      store['apiKey'] = k;
    }),
    clearAuth: jest.fn(() => {
      delete store['authCode'];
      delete store['token'];
      delete store['apiKey'];
    }),
    getToken: jest.fn(() => store['token'] || ''),
    getApiKey: jest.fn(() => store['apiKey'] || ''),
    getAuthCode: jest.fn(() => store['authCode'] || ''),
    isAuthorized: jest.fn(() => !!store['apiKey']),
    hasToken: jest.fn(() => !!store['token']),
    configFilePath: jest.fn(() => '/mock/.lbp-growth-calendar/config.json'),
    readConfig: jest.fn(() => ({
      authCode: store['authCode'],
      token: store['token'],
      apiKey: store['apiKey']
    })),
    writeConfig: jest.fn(),
  };
});

jest.mock('../utils/http', () => ({
  ...jest.requireActual('../utils/http'),
  apiRequestWithBearer: jest.fn(),
  apiRequestWithApiKey: jest.fn(),
  outputJSON: jest.fn(),
  outputError: jest.fn((msg: string, code: string) => {
    const { outputJSON } = jest.requireActual('../utils/http');
    outputJSON({ ok: false, error: code, message: msg });
    process.exit(1);
  }),
}));

import {
  saveAuthCode,
  saveToken,
  saveApiKey,
  saveAuth,
  clearAuth,
  getToken,
  getApiKey,
  getAuthCode,
  isAuthorized,
  hasToken,
  configFilePath,
} from '../utils/config';
import { apiRequestWithBearer, apiRequestWithApiKey, outputJSON } from '../utils/http';

describe('auth command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveAuthCode is callable', () => {
    saveAuthCode('auth-code-123');
    expect(saveAuthCode).toHaveBeenCalledWith('auth-code-123');
  });

  test('saveToken is callable', () => {
    saveToken('token-123');
    expect(saveToken).toHaveBeenCalledWith('token-123');
  });

  test('saveApiKey is callable', () => {
    saveApiKey('api-key-123');
    expect(saveApiKey).toHaveBeenCalledWith('api-key-123');
  });

  test('saveAuth saves both token and apiKey', () => {
    saveAuth('token-123', 'api-key-456');
    expect(saveAuth).toHaveBeenCalledWith('token-123', 'api-key-456');
  });

  test('getToken returns empty string when not set', () => {
    (getToken as jest.Mock).mockReturnValueOnce('');
    expect(getToken()).toBe('');
  });

  test('getToken returns stored token', () => {
    (getToken as jest.Mock).mockReturnValueOnce('stored-token');
    expect(getToken()).toBe('stored-token');
  });

  test('getApiKey returns empty string when not set', () => {
    (getApiKey as jest.Mock).mockReturnValueOnce('');
    expect(getApiKey()).toBe('');
  });

  test('getAuthCode returns stored auth code', () => {
    (getAuthCode as jest.Mock).mockReturnValueOnce('auth-code-123');
    expect(getAuthCode()).toBe('auth-code-123');
  });

  test('isAuthorized returns false when no apiKey', () => {
    (isAuthorized as jest.Mock).mockReturnValueOnce(false);
    expect(isAuthorized()).toBe(false);
  });

  test('isAuthorized returns true when apiKey exists', () => {
    (isAuthorized as jest.Mock).mockReturnValueOnce(true);
    expect(isAuthorized()).toBe(true);
  });

  test('hasToken returns false when no token', () => {
    (hasToken as jest.Mock).mockReturnValueOnce(false);
    expect(hasToken()).toBe(false);
  });

  test('clearAuth removes all auth info', () => {
    saveAuth('token', 'api');
    clearAuth();
    expect(clearAuth).toHaveBeenCalled();
  });

  test('configFilePath returns path ending in config.json', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
  });
});

describe('auth init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('init without token uses default bearer token', async () => {
    const mockResponse = {
      code: 'abc123def456',
      authUrl: 'https://example.com/auth?code=abc123def456',
    };
    (apiRequestWithBearer as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'init']);

    // 应该使用内置的 DEFAULT_BEARER_TOKEN 调用
    expect(apiRequestWithBearer).toHaveBeenCalledWith(
      'POST',
      '/openapi/agent-auth/init',
      expect.any(String)
    );
    // 不再保存 token（已内置），只保存 authCode
    expect(saveToken).not.toHaveBeenCalled();
    expect(saveAuthCode).toHaveBeenCalledWith('abc123def456');
  });

  test('init with server error returns error', async () => {
    (apiRequestWithBearer as jest.Mock).mockResolvedValueOnce({
      status: 500,
      data: { message: 'Internal Server Error' },
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'init']);

    expect(apiRequestWithBearer).toHaveBeenCalled();
    expect(saveAuthCode).not.toHaveBeenCalled();
  });
});

describe('auth verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('verify with code uses default bearer token', async () => {
    const mockResponse = {
      status: 'completed',
      token: 'api-key-123',
      userId: 'user123',
      userName: 'Test User',
      expiresAt: '2026-07-18T10:30:00.000Z',
    };
    (apiRequestWithBearer as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', 'auth-code-123']);

    // 应该使用内置的 DEFAULT_BEARER_TOKEN 调用
    expect(apiRequestWithBearer).toHaveBeenCalledWith(
      'POST',
      '/openapi/agent-auth/verify',
      expect.any(String),
      { code: 'auth-code-123' }
    );
    expect(saveApiKey).toHaveBeenCalledWith('api-key-123');
  });


  test('verify with --api-key validates API key and returns valid status', async () => {
    const mockResponse = {
      status: 'valid',
      userId: 'user123',
      userName: 'Test User',
      expiresAt: '2026-07-18T10:30:00.000Z',
      isAdmin: true,
    };
    (apiRequestWithApiKey as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', '--api-key', 'test-api-key-123']);

    expect(apiRequestWithApiKey).toHaveBeenCalledWith(
      'POST',
      '/openapi/agent-auth/verify',
      'test-api-key-123'
    );
    expect(saveApiKey).not.toHaveBeenCalled();
  });

  test('verify with --api-key returns invalid status with reason', async () => {
    const mockResponse = {
      status: 'invalid',
      reason: 'Token 已过期',
    };
    (apiRequestWithApiKey as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', '--api-key', 'expired-api-key']);

    expect(apiRequestWithApiKey).toHaveBeenCalledWith(
      'POST',
      '/openapi/agent-auth/verify',
      'expired-api-key'
    );
  });

  test('verify with both code and --api-key returns error', async () => {
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', 'some-code', '--api-key', 'some-key']);

    expect(apiRequestWithBearer).not.toHaveBeenCalled();
    expect(apiRequestWithApiKey).not.toHaveBeenCalled();
  });

  test('verify without code or --api-key returns error', async () => {
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify']);

    expect(apiRequestWithBearer).not.toHaveBeenCalled();
    expect(apiRequestWithApiKey).not.toHaveBeenCalled();
  });
});

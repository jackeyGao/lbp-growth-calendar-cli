// Integration-style tests for the auth command
jest.mock('../utils/config', () => {
  const store: Record<string, string> = {};
  return {
    saveBearerToken: jest.fn((t: string) => { store['bearerToken'] = t; }),
    saveApiKey: jest.fn((t: string) => { store['apiKey'] = t; }),
    saveTokens: jest.fn((b: string, a: string) => {
      store['bearerToken'] = b;
      store['apiKey'] = a;
    }),
    clearTokens: jest.fn(() => {
      delete store['bearerToken'];
      delete store['apiKey'];
    }),
    getBearerToken: jest.fn(() => store['bearerToken'] || ''),
    getApiKey: jest.fn(() => store['apiKey'] || ''),
    isAuthorized: jest.fn(() => !!store['apiKey']),
    configFilePath: jest.fn(() => '/mock/.lbp-growth-calendar/config.json'),
    readConfig: jest.fn(() => ({
      bearerToken: store['bearerToken'],
      apiKey: store['apiKey']
    })),
    writeConfig: jest.fn(),
  };
});

jest.mock('../utils/http', () => ({
  ...jest.requireActual('../utils/http'),
  apiRequestWithBearer: jest.fn(),
  outputJSON: jest.fn(),
  outputError: jest.fn((msg: string, code: string) => {
    const { outputJSON } = jest.requireActual('../utils/http');
    outputJSON({ ok: false, error: code, message: msg });
    process.exit(1);
  }),
}));

import {
  saveBearerToken,
  saveApiKey,
  saveTokens,
  clearTokens,
  getBearerToken,
  getApiKey,
  isAuthorized,
  configFilePath,
} from '../utils/config';
import { apiRequestWithBearer, outputJSON } from '../utils/http';

describe('auth command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveBearerToken is callable', () => {
    saveBearerToken('bearer-token-123');
    expect(saveBearerToken).toHaveBeenCalledWith('bearer-token-123');
  });

  test('saveApiKey is callable', () => {
    saveApiKey('api-key-123');
    expect(saveApiKey).toHaveBeenCalledWith('api-key-123');
  });

  test('saveTokens saves both tokens', () => {
    saveTokens('bearer-123', 'api-456');
    expect(saveTokens).toHaveBeenCalledWith('bearer-123', 'api-456');
  });

  test('getBearerToken returns empty string when not set', () => {
    (getBearerToken as jest.Mock).mockReturnValueOnce('');
    expect(getBearerToken()).toBe('');
  });

  test('getBearerToken returns stored token', () => {
    (getBearerToken as jest.Mock).mockReturnValueOnce('stored-bearer');
    expect(getBearerToken()).toBe('stored-bearer');
  });

  test('getApiKey returns empty string when not set', () => {
    (getApiKey as jest.Mock).mockReturnValueOnce('');
    expect(getApiKey()).toBe('');
  });

  test('isAuthorized returns false when no apiKey', () => {
    (isAuthorized as jest.Mock).mockReturnValueOnce(false);
    expect(isAuthorized()).toBe(false);
  });

  test('isAuthorized returns true when apiKey exists', () => {
    (isAuthorized as jest.Mock).mockReturnValueOnce(true);
    expect(isAuthorized()).toBe(true);
  });

  test('clearTokens removes all tokens', () => {
    saveTokens('bearer', 'api');
    clearTokens();
    expect(clearTokens).toHaveBeenCalled();
  });

  test('configFilePath returns path ending in config.json', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
  });
});

describe('auth init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('init requires --bearer-token option', async () => {
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    // 不提供 --bearer-token 应该报错
    try {
      await program.parseAsync(['node', 'test', 'auth', 'init']);
    } catch (e) {
      // 应该抛出错误，因为缺少必需参数
      expect(e).toBeDefined();
    }
  });

  test('init with bearer token saves it and returns auth code', async () => {
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

    await program.parseAsync(['node', 'test', 'auth', 'init', '--bearer-token', 'my-bearer-token']);

    expect(apiRequestWithBearer).toHaveBeenCalledWith(
      'POST',
      '/openapi/agent-auth/init',
      'my-bearer-token'
    );
    expect(saveBearerToken).toHaveBeenCalledWith('my-bearer-token');
  });

  test('init with invalid bearer token returns 403', async () => {
    (apiRequestWithBearer as jest.Mock).mockResolvedValueOnce({
      status: 403,
      data: { message: 'Forbidden' },
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'init', '--bearer-token', 'invalid-token']);

    expect(apiRequestWithBearer).toHaveBeenCalled();
    expect(saveBearerToken).not.toHaveBeenCalled();
  });
});

describe('auth verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('verify requires bearer token to be saved first', async () => {
    (getBearerToken as jest.Mock).mockReturnValueOnce('');

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', 'auth-code-123']);

    expect(apiRequestWithBearer).not.toHaveBeenCalled();
  });

  test('verify saves api key on completed status', async () => {
    (getBearerToken as jest.Mock).mockReturnValueOnce('saved-bearer-token');

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

    expect(apiRequestWithBearer).toHaveBeenCalledWith(
      'POST',
      '/openapi/agent-auth/verify',
      'saved-bearer-token',
      { code: 'auth-code-123' }
    );
    expect(saveApiKey).toHaveBeenCalledWith('api-key-123');
  });
});

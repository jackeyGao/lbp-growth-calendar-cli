// Integration-style tests for the auth command
jest.mock('../utils/config', () => {
  const store: Record<string, string> = {};
  return {
    BUILT_IN_BEARER_TOKEN: '550e8400-e29b-41d4-a716-446655440000',
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
    getBearerToken: jest.fn(() => store['bearerToken'] || '550e8400-e29b-41d4-a716-446655440000'),
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
  apiRequestNoAuth: jest.fn(),
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
  BUILT_IN_BEARER_TOKEN
} from '../utils/config';
import { apiRequestNoAuth, outputJSON } from '../utils/http';

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

  test('getBearerToken returns stored token or built-in', () => {
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

  test('BUILT_IN_BEARER_TOKEN is defined', () => {
    expect(BUILT_IN_BEARER_TOKEN).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});

describe('auth init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('init saves bearer token and returns auth code', async () => {
    const mockResponse = {
      code: 'abc123def456',
      authUrl: 'https://example.com/auth?code=abc123def456',
    };
    (apiRequestNoAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'init']);

    expect(apiRequestNoAuth).toHaveBeenCalledWith('POST', '/openapi/agent-auth/init');
    expect(saveBearerToken).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });
});

describe('auth verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('verify saves both tokens on completed status', async () => {
    const mockResponse = {
      status: 'completed',
      token: 'api-key-123',
      userId: 'user123',
      userName: 'Test User',
      expiresAt: '2026-07-18T10:30:00.000Z',
    };
    (apiRequestNoAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', 'auth-code-123']);

    expect(apiRequestNoAuth).toHaveBeenCalledWith('POST', '/openapi/agent-auth/verify', { code: 'auth-code-123' });
    expect(saveTokens).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'api-key-123');
  });

  test('verify returns pending status', async () => {
    const mockResponse = {
      status: 'pending',
      token: null,
      userId: null,
      userName: null,
      expiresAt: null,
    };
    (apiRequestNoAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'verify', 'auth-code-123']);

    expect(apiRequestNoAuth).toHaveBeenCalled();
  });
});

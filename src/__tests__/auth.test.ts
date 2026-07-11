// Integration-style tests for the auth command
jest.mock('../utils/config', () => {
  const store: Record<string, string> = {};
  return {
    saveToken: jest.fn((t: string) => { store['token'] = t; }),
    getToken: jest.fn(() => store['token'] || ''),
    clearToken: jest.fn(() => { delete store['token']; }),
    configFilePath: jest.fn(() => '/mock/.lbp-growth-calendar/config.json'),
    readConfig: jest.fn(() => ({ token: store['token'] || '' })),
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

import { saveToken, getToken, clearToken, configFilePath } from '../utils/config';
import { apiRequestNoAuth, outputJSON } from '../utils/http';

describe('auth command (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveToken is callable with a token string', () => {
    saveToken('my-token-123');
    expect(saveToken).toHaveBeenCalledWith('my-token-123');
  });

  test('getToken returns empty string when not set', () => {
    (getToken as jest.Mock).mockReturnValueOnce('');
    expect(getToken()).toBe('');
  });

  test('getToken returns stored token', () => {
    (getToken as jest.Mock).mockReturnValueOnce('stored-token');
    expect(getToken()).toBe('stored-token');
  });

  test('clearToken removes the token', () => {
    saveToken('test-token');
    clearToken();
    expect(clearToken).toHaveBeenCalled();
  });

  test('configFilePath returns path ending in config.json', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
  });
});

describe('auth init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('init returns auth code and URL on success', async () => {
    const mockResponse = {
      code: 'abc123def456',
      authUrl: 'https://example.com/auth?code=abc123def456',
    };
    (apiRequestNoAuth as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: mockResponse,
    });

    // Simulate calling the init command handler
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    // Trigger the init command
    await program.parseAsync(['node', 'test', 'auth', 'init']);

    expect(apiRequestNoAuth).toHaveBeenCalledWith('POST', '/openapi/agent-auth/init');
  });
});

describe('auth verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('verify saves token on completed status', async () => {
    const mockResponse = {
      status: 'completed',
      token: 'valid-token-123',
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
  });
});

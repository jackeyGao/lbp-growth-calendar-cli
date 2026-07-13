jest.mock('../utils/config', () => ({
  saveToken: jest.fn(),
  clearAuth: jest.fn(),
  getSavedToken: jest.fn(() => ''),
  getToken: jest.fn(() => ''),
  hasToken: jest.fn(() => false),
  configFilePath: jest.fn(() => '/mock/.lbp-growth-calendar/config.json'),
  getTokenEnvKey: jest.fn(() => 'LBP_GROWTH_CALENDAR_TOKEN'),
}));

jest.mock('../utils/http', () => ({
  outputJSON: jest.fn(),
  outputError: jest.fn((msg: string, code: string) => {
    throw new Error(`${code}:${msg}`);
  }),
}));

import {
  saveToken,
  clearAuth,
  getSavedToken,
  getToken,
  hasToken,
  configFilePath,
  getTokenEnvKey,
} from '../utils/config';
import { outputJSON } from '../utils/http';

describe('auth command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.LBP_GROWTH_CALENDAR_TOKEN;
  });

  test('auth save stores token', async () => {
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'save', 'token-123']);

    expect(saveToken).toHaveBeenCalledWith('token-123');
    expect(outputJSON).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      configured: true,
      configFile: '/mock/.lbp-growth-calendar/config.json',
    }));
  });

  test('auth status shows env source when env token exists', async () => {
    (getToken as jest.Mock).mockReturnValue('env-token-123456');
    (hasToken as jest.Mock).mockReturnValue(true);
    process.env.LBP_GROWTH_CALENDAR_TOKEN = 'env-token-123456';

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'status']);

    expect(outputJSON).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      configured: true,
      token: expect.objectContaining({ source: 'env' }),
      envKey: 'LBP_GROWTH_CALENDAR_TOKEN',
    }));
  });

  test('auth status shows file source when saved token exists', async () => {
    (getSavedToken as jest.Mock).mockReturnValue('saved-token-123456');
    (getToken as jest.Mock).mockReturnValue('saved-token-123456');
    (hasToken as jest.Mock).mockReturnValue(true);

    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'status']);

    expect(outputJSON).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      configured: true,
      token: expect.objectContaining({ source: 'file' }),
    }));
  });

  test('auth clear removes local token', async () => {
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await program.parseAsync(['node', 'test', 'auth', 'clear']);

    expect(clearAuth).toHaveBeenCalled();
    expect(outputJSON).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('auth save rejects empty token', async () => {
    const { registerAuthCommand } = await import('../commands/auth');
    const { Command } = await import('commander');
    const program = new Command();
    registerAuthCommand(program);

    await expect(program.parseAsync(['node', 'test', 'auth', 'save', '   '])).rejects.toThrow('INVALID_ARGS:Token 不能为空');
  });

  test('status exposes config file and env key', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
    expect(getTokenEnvKey()).toBe('LBP_GROWTH_CALENDAR_TOKEN');
  });
});

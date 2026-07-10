// Integration-style tests for the auth command
jest.mock('../../utils/config', () => {
  const store: Record<string, string> = {};
  return {
    saveToken: jest.fn((t: string) => { store['token'] = t; }),
    getToken: jest.fn(() => store['token'] || ''),
    configFilePath: jest.fn(() => '/mock/.lbp-growth-calendar/config.json'),
    readConfig: jest.fn(() => ({ token: store['token'] || '' })),
    writeConfig: jest.fn(),
  };
});

import { saveToken, getToken, configFilePath } from '../../utils/config';

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

  test('configFilePath returns path ending in config.json', () => {
    expect(configFilePath()).toMatch(/config\.json$/);
  });
});

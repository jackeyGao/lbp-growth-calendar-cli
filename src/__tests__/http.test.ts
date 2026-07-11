import { BASE_URL } from '../utils/http';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
// Mock config
jest.mock('../utils/config', () => ({
  getToken: jest.fn(() => 'mock-token'),
  getApiKey: jest.fn(() => 'mock-api-key'),
}));

import fetch from 'node-fetch';
import { apiRequest, apiRequestWithBearer, getRequestOptions, outputSuccess, outputError } from '../utils/http';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('http utils', () => {
  describe('BASE_URL', () => {
    test('is hardcoded to correct value', () => {
      expect(BASE_URL).toBe('https://bytedance.aiforce.cloud/app/app_179t4b8e4mv');
    });
  });

  describe('getRequestOptions', () => {
    test('reads both token and apiKey from config', () => {
      const opts = getRequestOptions();
      expect(opts.token).toBe('mock-token');
      expect(opts.apiKey).toBe('mock-api-key');
    });
  });

  describe('apiRequest', () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    test('sends GET request with both Authorization and x-api-key headers', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ items: [] }),
      } as unknown as ReturnType<typeof fetch>);

      const result = await apiRequest('GET', '/openapi/dau', {
        token: 'token-123',
        apiKey: 'apikey-456'
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/openapi/dau`);
      expect((options as Record<string, unknown>).method).toBe('GET');

      const headers = (options as Record<string, unknown>).headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer token-123');
      expect(headers['x-api-key']).toBe('apikey-456');
      expect(result.status).toBe(200);
    });

    test('sends request with only Authorization when no apiKey', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ items: [] }),
      } as unknown as ReturnType<typeof fetch>);

      const result = await apiRequest('GET', '/openapi/dau', {
        token: 'token-123'
      });

      const headers = ((mockFetch.mock.calls[0][1] as Record<string, unknown>).headers as Record<string, string>);
      expect(headers['Authorization']).toBe('Bearer token-123');
      expect(headers['x-api-key']).toBeUndefined();
    });

    test('sends POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: async () => ({ id: 'new-id' }),
      } as unknown as ReturnType<typeof fetch>);

      await apiRequest('POST', '/openapi/events', {
        token: 'token-123',
        apiKey: 'apikey-456'
      }, {
        date: '2026-07-10',
        eventType: 'activation',
        name: '测试事件',
        expectedUsers: 1.5,
      });

      const [, options] = mockFetch.mock.calls[0];
      expect((options as Record<string, unknown>).body).toContain('测试事件');
    });

    test('exits process on 401 UNAUTHORIZED error', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          statusCode: 401,
          message: 'Unauthorized',
        }),
      } as unknown as ReturnType<typeof fetch>);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });

      await expect(
        apiRequest('GET', '/openapi/dau', { token: 'bad-token' })
      ).rejects.toThrow('process.exit(1)');

      mockExit.mockRestore();
    });

    test('exits process on 403 FORBIDDEN error', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 403,
        json: async () => ({
          statusCode: 403,
          message: 'Forbidden',
        }),
      } as unknown as ReturnType<typeof fetch>);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });

      await expect(
        apiRequest('GET', '/openapi/dau', { token: 'valid-token' })
      ).rejects.toThrow('process.exit(1)');

      mockExit.mockRestore();
    });

    test('returns data on success without auth error', async () => {
      const mockData = [{ date: '2026-07-10', quotaConsumption: 12.5 }];
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockData,
      } as unknown as ReturnType<typeof fetch>);

      const result = await apiRequest('GET', '/openapi/dau', { token: 'valid-token' });
      expect(result.status).toBe(200);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('apiRequestWithBearer', () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    test('sends request with specified token', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ code: 'abc123', authUrl: 'https://example.com/auth' }),
      } as unknown as ReturnType<typeof fetch>);

      const result = await apiRequestWithBearer('POST', '/openapi/agent-auth/init', 'my-token');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      const headers = (options as Record<string, unknown>).headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer my-token');
      expect(headers['x-api-key']).toBeUndefined();
      expect(result.status).toBe(200);
    });

    test('sends POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ status: 'completed', token: 'new-token' }),
      } as unknown as ReturnType<typeof fetch>);

      await apiRequestWithBearer('POST', '/openapi/agent-auth/verify', 'my-token', { code: 'auth-code-123' });

      const [, options] = mockFetch.mock.calls[0];
      expect((options as Record<string, unknown>).body).toContain('auth-code-123');
    });

    test('exits process on 403 FORBIDDEN error', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 403,
        json: async () => ({
          statusCode: 403,
          message: 'Forbidden',
        }),
      } as unknown as ReturnType<typeof fetch>);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });

      await expect(
        apiRequestWithBearer('POST', '/openapi/agent-auth/init', 'invalid-token')
      ).rejects.toThrow('process.exit(1)');

      mockExit.mockRestore();
    });
  });

  describe('outputSuccess', () => {
    test('prints ok:true with data', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      outputSuccess({ foo: 'bar' });
      const output = JSON.parse(spy.mock.calls[0][0]);
      expect(output.ok).toBe(true);
      expect(output.data).toEqual({ foo: 'bar' });
      spy.mockRestore();
    });
  });

  describe('outputError', () => {
    test('prints ok:false and exits', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`exit:${code}`);
      });

      expect(() => outputError('something failed', 'TEST_ERROR')).toThrow('exit:1');
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.ok).toBe(false);
      expect(output.error).toBe('TEST_ERROR');
      expect(output.message).toBe('something failed');

      logSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});

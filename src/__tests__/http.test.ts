import { BASE_URL } from '../utils/http';

jest.mock('node-fetch', () => jest.fn());

import fetch from 'node-fetch';
import { apiRequest, getRequestOptions, outputSuccess, outputError } from '../utils/http';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('http utils', () => {
  describe('BASE_URL', () => {
    test('is hardcoded to correct value', () => {
      expect(BASE_URL).toBe('https://bytedance.aiforce.cloud/app/app_179t4b8e4mv');
    });
  });

  describe('getRequestOptions', () => {
    const config = jest.requireActual('../utils/config');

    afterEach(() => {
      config.setRuntimeToken(undefined);
      delete process.env[config.getTokenEnvKey()];
    });

    test('reads token from runtime/env/config chain', () => {
      config.setRuntimeToken('runtime-token');
      const opts = getRequestOptions();
      expect(opts.token).toBe('runtime-token');
    });
  });

  describe('apiRequest', () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    test('sends GET request with Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ items: [] }),
      } as unknown as ReturnType<typeof fetch>);

      const result = await apiRequest('GET', '/openapi/dau', {
        token: 'token-123',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(`${BASE_URL}/openapi/dau`);
      expect((options as Record<string, unknown>).method).toBe('GET');

      const headers = (options as Record<string, unknown>).headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer token-123');
      expect(headers['Content-Type']).toBe('application/json');
      expect(result.status).toBe(200);
    });

    test('sends POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: async () => ({ id: 'new-id' }),
      } as unknown as ReturnType<typeof fetch>);

      await apiRequest('POST', '/openapi/events', {
        token: 'token-123',
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

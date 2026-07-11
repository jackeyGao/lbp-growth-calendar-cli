import { Command } from 'commander';
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
import { outputJSON, outputError, apiRequestWithBearer } from '../utils/http';

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('认证管理（Token 配置）');

  // auth init - 发起授权流程，需要提供 bearer token
  auth
    .command('init')
    .description('发起授权流程，获取授权码和授权链接')
    .requiredOption('--bearer-token <token>', 'Bearer Token（从管理员获取）')
    .action(async (opts) => {
      try {
        const bearerToken = opts.bearerToken;

        if (!bearerToken) {
          outputError(
            'Bearer Token 不能为空。请提供 --bearer-token 参数，或联系管理员获取。',
            'MISSING_BEARER_TOKEN'
          );
          return;
        }

        // 使用用户提供的 Bearer Token 调用 init 接口
        const { status, data } = await apiRequestWithBearer(
          'POST',
          '/openapi/agent-auth/init',
          bearerToken
        );

        if (status !== 200) {
          outputError(
            `发起授权失败: HTTP ${status}。请确认 bearer token 正确且有权限访问 init 接口。`,
            'AUTH_INIT_FAILED'
          );
          return;
        }

        const response = data as { code: string; authUrl: string };

        // 成功后保存用户提供的 Bearer Token
        saveBearerToken(bearerToken);

        outputJSON({
          ok: true,
          message: '授权流程已发起，Bearer Token 已保存到本地配置',
          authCode: response.code,
          authUrl: response.authUrl,
          instructions: [
            '1. 在浏览器中访问上面的 authUrl',
            '2. 完成登录授权',
            '3. 执行: lbp-growth-calendar auth verify ' + response.code,
          ],
          note: 'Bearer Token 和后续获取的 API Key 都已保存到本地，后续命令会自动使用',
        });
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'AUTH_INIT_FAILED'
        );
      }
    });

  // auth verify <code> - 用 authCode 换取 API Key
  auth
    .command('verify <code>')
    .description('用授权码换取 API Key')
    .action(async (code: string) => {
      try {
        // 获取已保存的 bearer token
        const bearerToken = getBearerToken();

        if (!bearerToken) {
          outputError(
            '未找到 Bearer Token。请先执行：lbp-growth-calendar auth init --bearer-token <token>',
            'MISSING_BEARER_TOKEN'
          );
          return;
        }

        const { status, data } = await apiRequestWithBearer(
          'POST',
          '/openapi/agent-auth/verify',
          bearerToken,
          { code }
        );

        if (status === 404) {
          outputError('无效的授权码', 'INVALID_AUTH_CODE');
          return;
        }

        if (status !== 200) {
          outputError(`验证授权码失败: HTTP ${status}`, 'AUTH_VERIFY_FAILED');
          return;
        }

        const response = data as {
          status: 'pending' | 'completed' | 'expired';
          token: string | null;
          userId: string | null;
          userName: string | null;
          expiresAt: string | null;
        };

        if (response.status === 'pending') {
          outputJSON({
            ok: false,
            error: 'AUTH_PENDING',
            message: '用户尚未完成授权，请在浏览器中访问 auth init 提供的链接完成授权',
            status: response.status,
          });
          return;
        }

        if (response.status === 'expired') {
          outputJSON({
            ok: false,
            error: 'AUTH_EXPIRED',
            message: '授权码已过期，请重新执行 lbp-growth-calendar auth init',
            status: response.status,
          });
          return;
        }

        if (response.status === 'completed' && response.token) {
          // 保存 API Key（Bearer Token 已在 init 时保存）
          saveApiKey(response.token);
          outputJSON({
            ok: true,
            message: '授权成功，Bearer Token 和 API Key 已保存',
            user: {
              userId: response.userId,
              userName: response.userName,
            },
            expiresAt: response.expiresAt,
            configFile: configFilePath(),
            note: '两个 Token 都已保存：Bearer Token（固定）+ API Key（动态，有过期时间）',
          });
          return;
        }

        outputError('未知的授权状态', 'UNKNOWN_AUTH_STATUS');
      } catch (error) {
        outputError(
          error instanceof Error ? error.message : String(error),
          'AUTH_VERIFY_FAILED'
        );
      }
    });

  // auth status
  auth
    .command('status')
    .description('查看当前 Token 配置状态')
    .action(() => {
      const bearerToken = getBearerToken();
      const apiKey = getApiKey();
      const authorized = isAuthorized();

      if (bearerToken && apiKey) {
        outputJSON({
          ok: true,
          configured: true,
          bearerToken: {
            configured: true,
            preview: `${bearerToken.slice(0, 6)}...${bearerToken.slice(-4)}`,
            type: '固定值（长期有效）',
          },
          apiKey: {
            configured: true,
            preview: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
            type: '动态值（有过期时间）',
          },
          configFile: configFilePath(),
        });
      } else if (bearerToken && !apiKey) {
        outputJSON({
          ok: false,
          configured: false,
          bearerToken: {
            configured: true,
            preview: `${bearerToken.slice(0, 6)}...${bearerToken.slice(-4)}`,
          },
          apiKey: {
            configured: false,
            message: '未完成 verify 步骤',
          },
          message: 'Bearer Token 已配置，但 API Key 未获取。请执行 auth verify <code> 完成授权。',
        });
      } else {
        outputJSON({
          ok: false,
          configured: false,
          bearerToken: { configured: false },
          apiKey: { configured: false },
          message: '尚未完成授权，请执行授权流程：\n  1. lbp-growth-calendar auth init --bearer-token <token>\n  2. 在浏览器中完成授权\n  3. lbp-growth-calendar auth verify <auth-code>',
          configFile: configFilePath(),
        });
      }
    });

  // auth clear
  auth
    .command('clear')
    .description('清除本地保存的所有 Token')
    .action(() => {
      clearTokens();
      outputJSON({ ok: true, message: '所有 Token 已清除' });
    });
}

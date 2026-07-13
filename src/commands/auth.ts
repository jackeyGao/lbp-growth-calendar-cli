import { Command } from 'commander';
import {
  saveToken,
  clearAuth,
  getSavedToken,
  getToken,
  hasToken,
  configFilePath,
  getTokenEnvKey,
} from '../utils/config';
import { outputJSON, outputError } from '../utils/http';

function maskToken(token: string): string {
  if (token.length <= 10) {
    return `${token.slice(0, 3)}***`;
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('认证管理（Bearer Token 配置）');

  auth
    .command('save <token>')
    .description('保存 Bearer Token 到本地配置文件')
    .action((token: string) => {
      const normalized = token.trim();
      if (!normalized) {
        outputError('Token 不能为空', 'INVALID_ARGS');
      }

      saveToken(normalized);
      outputJSON({
        ok: true,
        message: 'Bearer Token 已保存',
        configured: true,
        configFile: configFilePath(),
      });
    });

  auth
    .command('status')
    .description('查看当前 Token 配置状态')
    .action(() => {
      const effectiveToken = getToken();
      const savedToken = getSavedToken();
      const envToken = process.env[getTokenEnvKey()]?.trim();

      let source: 'env' | 'file' | 'none' = 'none';
      if (envToken) {
        source = 'env';
      } else if (savedToken) {
        source = 'file';
      }

      outputJSON({
        ok: true,
        configured: hasToken(),
        token: effectiveToken
          ? {
              configured: true,
              source,
              preview: maskToken(effectiveToken),
            }
          : {
              configured: false,
            },
        configFile: configFilePath(),
        envKey: getTokenEnvKey(),
        message: effectiveToken
          ? 'Bearer Token 已配置'
          : '尚未配置 Bearer Token',
        setupInstructions: effectiveToken
          ? undefined
          : [
              '方式 1：lbp-growth-calendar auth save <token>',
              `方式 2：export ${getTokenEnvKey()}="your_bearer_token_here"`,
              '方式 3：本次命令追加 --token <token>',
            ],
      });
    });

  auth
    .command('clear')
    .description('清除本地保存的 Bearer Token')
    .action(() => {
      clearAuth();
      outputJSON({
        ok: true,
        message: '本地保存的 Bearer Token 已清除',
        note: `如果环境变量 ${getTokenEnvKey()} 仍存在，命令仍可继续使用该环境变量。`,
      });
    });
}

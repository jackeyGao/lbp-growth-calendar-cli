import { Command } from 'commander';
import { saveToken, getToken, configFilePath } from '../utils/config';
import { outputJSON, outputError } from '../utils/http';

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('认证管理（Token 配置）');

  // auth save <token>
  auth
    .command('save <token>')
    .description('保存 Token 到本地配置文件')
    .action(async (token: string) => {

      if (!token) {
        outputError('Token 不能为空，请使用：lbp-growth-calendar auth save <token>', 'INVALID_ARGS');
        return;
      }

      saveToken(token);
      outputJSON({
        ok: true,
        message: `Token 已保存到 ${configFilePath()}`,
        hint: '如 Token 失效，请联系 jg 重新获取后再次执行 auth save',
      });
    });

  // auth status
  auth
    .command('status')
    .description('查看当前 Token 配置状态')
    .action(() => {
      const token = getToken();
      if (token) {
        outputJSON({
          ok: true,
          configured: true,
          tokenPreview: `${token.slice(0, 6)}...${token.slice(-4)}`,
          configFile: configFilePath(),
        });
      } else {
        outputJSON({
          ok: false,
          configured: false,
          message: '尚未配置 Token，请执行：lbp-growth-calendar auth save <token>\nToken 可以找 jg 要',
          configFile: configFilePath(),
        });
      }
    });

  // auth clear
  auth
    .command('clear')
    .description('清除本地保存的 Token')
    .action(() => {
      saveToken('');
      outputJSON({ ok: true, message: 'Token 已清除' });
    });
}

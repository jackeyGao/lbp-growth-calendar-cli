import { Command } from 'commander';
import * as readline from 'readline';
import { saveToken, getToken, configFilePath } from '../utils/config';
import { outputJSON } from '../utils/http';

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('认证管理（Token 配置）');

  // auth save --token <token>
  auth
    .command('save')
    .description('保存 Token 到本地配置文件')
    .option('--token <token>', '要保存的 Token')
    .action(async (opts) => {
      let token: string = opts.token || '';

      if (!token) {
        // 交互式输入
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        token = await new Promise<string>((resolve) => {
          rl.question('请输入 Token（Token 可以找 jg 要）：', (answer) => {
            rl.close();
            resolve(answer.trim());
          });
        });
      }

      if (!token) {
        outputJSON({ ok: false, error: 'INVALID_ARGS', message: 'Token 不能为空' });
        process.exit(1);
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
          message: '尚未配置 Token，请执行：lbp-growth-calendar auth save --token <your-token>\nToken 可以找 jg 要',
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

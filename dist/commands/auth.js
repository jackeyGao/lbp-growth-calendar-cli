"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommand = registerAuthCommand;
const config_1 = require("../utils/config");
const http_1 = require("../utils/http");
function registerAuthCommand(program) {
    const auth = program
        .command('auth')
        .description('认证管理（Token 配置）');
    // auth save <token>
    auth
        .command('save <token>')
        .description('保存 Token 到本地配置文件')
        .action(async (token) => {
        if (!token) {
            (0, http_1.outputError)('Token 不能为空，请使用：lbp-growth-calendar auth save <token>', 'INVALID_ARGS');
            return;
        }
        (0, config_1.saveToken)(token);
        (0, http_1.outputJSON)({
            ok: true,
            message: `Token 已保存到 ${(0, config_1.configFilePath)()}`,
            hint: '如 Token 失效，请联系 jg 重新获取后再次执行 auth save',
        });
    });
    // auth status
    auth
        .command('status')
        .description('查看当前 Token 配置状态')
        .action(() => {
        const token = (0, config_1.getToken)();
        if (token) {
            (0, http_1.outputJSON)({
                ok: true,
                configured: true,
                tokenPreview: `${token.slice(0, 6)}...${token.slice(-4)}`,
                configFile: (0, config_1.configFilePath)(),
            });
        }
        else {
            (0, http_1.outputJSON)({
                ok: false,
                configured: false,
                message: '尚未配置 Token，请执行：lbp-growth-calendar auth save <token>\nToken 可以找 jg 要',
                configFile: (0, config_1.configFilePath)(),
            });
        }
    });
    // auth clear
    auth
        .command('clear')
        .description('清除本地保存的 Token')
        .action(() => {
        (0, config_1.saveToken)('');
        (0, http_1.outputJSON)({ ok: true, message: 'Token 已清除' });
    });
}
//# sourceMappingURL=auth.js.map
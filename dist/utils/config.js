"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BEARER_TOKEN = void 0;
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
exports.saveAuthCode = saveAuthCode;
exports.getAuthCode = getAuthCode;
exports.saveToken = saveToken;
exports.getToken = getToken;
exports.saveApiKey = saveApiKey;
exports.getApiKey = getApiKey;
exports.saveAuth = saveAuth;
exports.clearAuth = clearAuth;
exports.isAuthorized = isAuthorized;
exports.hasToken = hasToken;
exports.configFilePath = configFilePath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_DIR = path.join(os.homedir(), '.lbp-growth-calendar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
// 内置的默认 Bearer Token（Agent 级别，用于访问 init/verify 接口）
exports.DEFAULT_BEARER_TOKEN = 'e548uqkSvCZ_EtfcwL5ZIIoEiNVEI3Ws0-xpAaRlkDg';
function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE))
            return {};
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
function writeConfig(config) {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}
/**
 * 保存授权码（init 获取）
 */
function saveAuthCode(authCode) {
    const config = readConfig();
    config.authCode = authCode;
    writeConfig(config);
}
/**
 * 获取授权码
 */
function getAuthCode() {
    const config = readConfig();
    return config.authCode || '';
}
/**
 * 保存 Token（用户提供，等同于 Bearer Token）
 */
function saveToken(token) {
    const config = readConfig();
    config.token = token;
    writeConfig(config);
}
/**
 * 获取 Token（Bearer Token）
 * 优先从配置文件读取，如未配置则返回内置的默认 Token
 */
function getToken() {
    const config = readConfig();
    return config.token || exports.DEFAULT_BEARER_TOKEN;
}
/**
 * 保存 API Key（通过 verify 获取）
 */
function saveApiKey(apiKey) {
    const config = readConfig();
    config.apiKey = apiKey;
    writeConfig(config);
}
/**
 * 获取 API Key
 */
function getApiKey() {
    const config = readConfig();
    return config.apiKey || '';
}
/**
 * 同时保存 Token 和 API Key
 */
function saveAuth(token, apiKey) {
    const config = readConfig();
    config.token = token;
    config.apiKey = apiKey;
    writeConfig(config);
}
/**
 * 清除所有认证信息
 */
function clearAuth() {
    const config = readConfig();
    delete config.authCode;
    delete config.token;
    delete config.apiKey;
    writeConfig(config);
}
/**
 * 检查是否已完成授权（有 API Key）
 */
function isAuthorized() {
    const config = readConfig();
    return !!config.apiKey;
}
/**
 * 检查是否有 Token
 */
function hasToken() {
    const config = readConfig();
    return !!config.token;
}
function configFilePath() {
    return CONFIG_FILE;
}
//# sourceMappingURL=config.js.map
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
exports.BUILT_IN_BEARER_TOKEN = void 0;
exports.readConfig = readConfig;
exports.writeConfig = writeConfig;
exports.saveBearerToken = saveBearerToken;
exports.saveApiKey = saveApiKey;
exports.saveTokens = saveTokens;
exports.clearTokens = clearTokens;
exports.getBearerToken = getBearerToken;
exports.getApiKey = getApiKey;
exports.isAuthorized = isAuthorized;
exports.configFilePath = configFilePath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_DIR = path.join(os.homedir(), '.lbp-growth-calendar');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
// 内置的 Bearer Token，用于访问 init 和 verify 接口
exports.BUILT_IN_BEARER_TOKEN = '550e8400-e29b-41d4-a716-446655440000';
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
 * 保存 Bearer Token（内置 token）
 */
function saveBearerToken(token) {
    const config = readConfig();
    config.bearerToken = token;
    writeConfig(config);
}
/**
 * 保存 API Key（用户通过 verify 获取的 token）
 */
function saveApiKey(apiKey) {
    const config = readConfig();
    config.apiKey = apiKey;
    writeConfig(config);
}
/**
 * 同时保存 Bearer Token 和 API Key
 */
function saveTokens(bearerToken, apiKey) {
    const config = readConfig();
    config.bearerToken = bearerToken;
    config.apiKey = apiKey;
    writeConfig(config);
}
/**
 * 清除所有 Token
 */
function clearTokens() {
    const config = readConfig();
    delete config.bearerToken;
    delete config.apiKey;
    writeConfig(config);
}
/**
 * 获取 Bearer Token（优先从配置读取，否则返回内置 token）
 */
function getBearerToken() {
    const config = readConfig();
    return config.bearerToken || exports.BUILT_IN_BEARER_TOKEN;
}
/**
 * 获取 API Key
 */
function getApiKey() {
    const config = readConfig();
    return config.apiKey || '';
}
/**
 * 检查是否已完成授权（有 API Key）
 */
function isAuthorized() {
    const config = readConfig();
    return !!config.apiKey;
}
function configFilePath() {
    return CONFIG_FILE;
}
//# sourceMappingURL=config.js.map
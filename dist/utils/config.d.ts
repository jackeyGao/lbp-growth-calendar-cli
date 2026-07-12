export declare const DEFAULT_BEARER_TOKEN = "e548uqkSvCZ_EtfcwL5ZIIoEiNVEI3Ws0-xpAaRlkDg";
export interface Config {
    authCode?: string;
    token?: string;
    apiKey?: string;
}
export declare function readConfig(): Config;
export declare function writeConfig(config: Config): void;
/**
 * 保存授权码（init 获取）
 */
export declare function saveAuthCode(authCode: string): void;
/**
 * 获取授权码
 */
export declare function getAuthCode(): string;
/**
 * 保存 Token（用户提供，等同于 Bearer Token）
 */
export declare function saveToken(token: string): void;
/**
 * 获取 Token（Bearer Token）
 */
export declare function getToken(): string;
/**
 * 保存 API Key（通过 verify 获取）
 */
export declare function saveApiKey(apiKey: string): void;
/**
 * 获取 API Key
 */
export declare function getApiKey(): string;
/**
 * 同时保存 Token 和 API Key
 */
export declare function saveAuth(token: string, apiKey: string): void;
/**
 * 清除所有认证信息
 */
export declare function clearAuth(): void;
/**
 * 检查是否已完成授权（有 API Key）
 */
export declare function isAuthorized(): boolean;
/**
 * 检查是否有 Token
 */
export declare function hasToken(): boolean;
export declare function configFilePath(): string;
//# sourceMappingURL=config.d.ts.map
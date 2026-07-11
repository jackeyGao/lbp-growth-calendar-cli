export declare const BUILT_IN_BEARER_TOKEN = "550e8400-e29b-41d4-a716-446655440000";
export interface Config {
    bearerToken?: string;
    apiKey?: string;
}
export declare function readConfig(): Config;
export declare function writeConfig(config: Config): void;
/**
 * 保存 Bearer Token（内置 token）
 */
export declare function saveBearerToken(token: string): void;
/**
 * 保存 API Key（用户通过 verify 获取的 token）
 */
export declare function saveApiKey(apiKey: string): void;
/**
 * 同时保存 Bearer Token 和 API Key
 */
export declare function saveTokens(bearerToken: string, apiKey: string): void;
/**
 * 清除所有 Token
 */
export declare function clearTokens(): void;
/**
 * 获取 Bearer Token（优先从配置读取，否则返回内置 token）
 */
export declare function getBearerToken(): string;
/**
 * 获取 API Key
 */
export declare function getApiKey(): string;
/**
 * 检查是否已完成授权（有 API Key）
 */
export declare function isAuthorized(): boolean;
export declare function configFilePath(): string;
//# sourceMappingURL=config.d.ts.map
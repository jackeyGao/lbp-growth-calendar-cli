export declare const BASE_URL = "https://bytedance.aiforce.cloud/app/app_179t4b8e4mv";
export interface RequestOptions {
    token: string;
    apiKey?: string;
}
export declare function getRequestOptions(): RequestOptions;
export declare function apiRequest(method: string, path: string, options: RequestOptions, body?: Record<string, unknown>): Promise<{
    status: number;
    data: unknown;
}>;
/**
 * 使用指定 Token 调用 API（用于 init 和 verify）
 */
export declare function apiRequestWithBearer(method: string, path: string, token: string, body?: Record<string, unknown>): Promise<{
    status: number;
    data: unknown;
}>;
/**
 * 使用 x-api-key header 调用 API（用于验证 API Key 有效性）
 */
export declare function apiRequestWithApiKey(method: string, path: string, apiKey: string, body?: Record<string, unknown>): Promise<{
    status: number;
    data: unknown;
}>;
export declare function outputJSON(data: unknown): void;
export declare function outputSuccess(data: unknown): void;
export declare function outputError(message: string, code?: string, exitCode?: number): never;
export declare function handleApiResponse(status: number, data: unknown, expectedStatus?: number): void;
//# sourceMappingURL=http.d.ts.map
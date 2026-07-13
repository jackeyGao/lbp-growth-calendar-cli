export declare const BASE_URL = "https://bytedance.aiforce.cloud/app/app_179t4b8e4mv";
export interface RequestOptions {
    token: string;
}
export declare function getRequestOptions(): RequestOptions;
export declare function apiRequest(method: string, path: string, options: RequestOptions, body?: Record<string, unknown>): Promise<{
    status: number;
    data: unknown;
}>;
export declare function outputJSON(data: unknown): void;
export declare function outputSuccess(data: unknown): void;
export declare function outputError(message: string, code?: string, exitCode?: number): never;
export declare function handleApiResponse(status: number, data: unknown, expectedStatus?: number): void;
//# sourceMappingURL=http.d.ts.map
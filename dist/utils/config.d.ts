export interface Config {
    token?: string;
}
export declare function readConfig(): Config;
export declare function writeConfig(config: Config): void;
export declare function saveToken(token: string): void;
export declare function clearAuth(): void;
export declare function getSavedToken(): string;
export declare function setRuntimeToken(token: string | undefined): void;
export declare function getToken(): string;
export declare function hasToken(): boolean;
export declare function configFilePath(): string;
export declare function getTokenEnvKey(): string;
//# sourceMappingURL=config.d.ts.map
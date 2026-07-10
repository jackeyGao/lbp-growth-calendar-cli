export interface Config {
    token?: string;
}
export declare function readConfig(): Config;
export declare function writeConfig(config: Config): void;
export declare function saveToken(token: string): void;
export declare function getToken(): string;
export declare function configFilePath(): string;
//# sourceMappingURL=config.d.ts.map
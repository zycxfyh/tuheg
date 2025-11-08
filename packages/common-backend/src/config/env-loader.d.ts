export interface EnvLoaderOptions {
  env?: string
  configDir?: string
  override?: boolean
  silent?: boolean
}
export declare class EnvLoader {
  static load(options?: EnvLoaderOptions): void
  static loadForApp(appName: string, options?: EnvLoaderOptions): void
}
//# sourceMappingURL=env-loader.d.ts.map

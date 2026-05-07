declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler: string;
      options?: Record<string, unknown>;
    }>;
    buildExcludes?: string[];
    publicExcludes?: string[];
    fallbacks?: Record<string, string>;
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    subdomainPrefix?: string;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}

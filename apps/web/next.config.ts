import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  output: "standalone",
  transpilePackages: ["@tend/core", "@tend/db", "@tend/minds"],
  serverExternalPackages: ["better-sqlite3", "@animocabrands/minds-client-lib"],
  poweredByHeader: false,
};

export default nextConfig;

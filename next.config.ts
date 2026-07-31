import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves a static export from the repository subpath.
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/vehicle-damage-inspection-system" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/vehicle-damage-inspection-system/" : undefined,
};

export default nextConfig;

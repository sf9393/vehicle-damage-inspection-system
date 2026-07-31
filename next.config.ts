import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dashboard contains no server-rendered routes and is exported statically.
  output: "export",
};

export default nextConfig;

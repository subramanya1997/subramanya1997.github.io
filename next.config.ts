import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: reproduces Jekyll's path/index.html layout on GitHub Pages
  // so every existing URL (and Google's index of it) is preserved exactly.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

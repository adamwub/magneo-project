/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @magnoo/shared adalah paket workspace (ESM) — biar Next ikut meng-compile.
  transpilePackages: ["@magnoo/shared"],
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Load Prisma's query engine at runtime instead of bundling it, which keeps
  // the serverless function working on Vercel.
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;

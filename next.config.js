/** @type {import('next').NextConfig} */
const repoName = 'COLDAIWAR1'

const nextConfig = {
  output: 'export',
  basePath: `/${repoName}`,
  assetPrefix: `/${repoName}/`,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

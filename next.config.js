/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
  // Increase serverless function size limit
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Enable WASM support for FFmpeg.wasm
  webpack: (config, { isServer }) => {
    // Add WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    
    // Don't bundle WASM on server side (client-side only)
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('@ffmpeg/ffmpeg', '@ffmpeg/util')
    }
    
    return config
  },
  // Add headers for SharedArrayBuffer (required by FFmpeg.wasm)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig


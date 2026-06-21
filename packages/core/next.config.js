// tsx/cjs registers a TypeScript loader so we can require .ts files below.
require("tsx/cjs")

const { withPetal } = require("./src/plugin")
const petalConfig = require("./petal.config").default

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@petal/sdk", "@petal/ui"],
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
}

module.exports = withPetal(petalConfig)(nextConfig)

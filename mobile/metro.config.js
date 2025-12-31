// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Monorepo: allow importing from ../shared
// Metro (by default) doesn't resolve files outside the project root.
const sharedPath = path.resolve(__dirname, '../shared')
config.watchFolders = Array.from(new Set([...(config.watchFolders || []), sharedPath]))

// Ensure Metro resolves node_modules correctly in a monorepo layout.
config.resolver = config.resolver || {}
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    ...(config.resolver.nodeModulesPaths || []),
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../node_modules'),
  ])
)

// Force hostname for Android emulator
if (process.env.EXPO_PLATFORM === 'android' || process.argv.includes('--android')) {
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Allow Android emulator to connect
        if (req.headers.host) {
          req.headers.host = '10.0.2.2:8081'
        }
        return middleware(req, res, next)
      }
    },
  }
}

module.exports = config


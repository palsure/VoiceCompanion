// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force hostname for Android emulator
if (process.env.EXPO_PLATFORM === 'android' || process.argv.includes('--android')) {
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Allow Android emulator to connect
        if (req.headers.host) {
          req.headers.host = '10.0.2.2:8081';
        }
        return middleware(req, res, next);
      };
    },
  };
}

module.exports = config;


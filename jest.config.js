/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@solar-icons/.*|nativewind|react-native-svg|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-css-interop)",
  ],
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "!lib/**/*.d.ts",
  ],
};

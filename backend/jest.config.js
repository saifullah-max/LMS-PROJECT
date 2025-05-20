module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/tests/**/*.test.js"],
  // Increase timeout for slow operations (e.g. model loads)
  testTimeout: 30000,
  globalSetup: "./tests/globalSetup.js",
  globalTeardown: "./tests/globalTeardown.js",
  setupFilesAfterEnv: ["./tests/setupAfterEnv.js"],
};

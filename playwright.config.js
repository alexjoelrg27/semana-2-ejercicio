const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8080",
  },
  webServer: {
    command: "node node_modules/http-server/bin/http-server . -p 8080 -c-1 -s",
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
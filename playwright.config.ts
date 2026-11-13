import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3210";
const mockBackendURL = "http://127.0.0.1:3211";

export default defineConfig({
  testDir: "./tests/api",
  fullyParallel: false,
  reporter: "list",
  use: { baseURL },
  webServer: [
    {
      command: "node tests/support/mock-backend.mjs",
      url: `${mockBackendURL}/health`,
      name: "Mock Spring API",
      env: { ...process.env, MOCK_BACKEND_PORT: "3211" },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3210",
      url: baseURL,
      name: "Next.js API",
      env: {
        ...process.env,
        BACKEND_API_URL: mockBackendURL,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

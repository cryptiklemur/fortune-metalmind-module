import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./test/e2e",
    globalSetup: "./test/e2e/global-setup.ts",
    workers: 1,
    fullyParallel: false,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [["list"]],
    use: {
        viewport: { width: 1920, height: 1080 },
        actionTimeout: 10_000,
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
    },
});

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default function globalSetup(): void {
    execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });

    const manifest = resolve(ROOT, "dist/module.json");
    const raw = readFileSync(manifest, "utf8");

    if (raw.includes("{{VERSION}}")) {
        writeFileSync(manifest, raw.replaceAll("{{VERSION}}", "0.0.0-test"));
    }
}

import { MODULE_ID } from "./constants.ts";

export class Logger {
    static log(...args: unknown[]): void {
        console.log(`[${MODULE_ID}]`, ...args);
    }

    static warn(...args: unknown[]): void {
        console.warn(`[${MODULE_ID}]`, ...args);
    }

    static error(...args: unknown[]): void {
        console.error(`[${MODULE_ID}]`, ...args);
    }

    static debug(...args: unknown[]): void {
        if (BUILD_MODE === "development") {
            console.debug(`[${MODULE_ID}]`, ...args);
        }
    }
}

import type { ThisModule } from "../api.ts";
import { MODULE_ID } from "../constants.ts";
import { FortuneManager } from "../fortune-manager.ts";
import { HandlebarHelpers } from "../handlebar-helpers.ts";
import { Logger } from "../logger.ts";
import { Settings } from "../settings.ts";
import type { Listener } from "./index.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", () => {
            new Settings().register();
            new HandlebarHelpers().register();

            (game.modules.get(MODULE_ID) as ThisModule).api = {
                FortuneManager,
            };

            if (!(globalThis as any).CONFIG?.COSMERE?.resources) {
                Logger.warn("CONFIG.COSMERE.resources not found - Cosmere RPG system may not be loaded");
            } else {
                (globalThis as any).CONFIG.COSMERE.resources.for = {
                    key: "for",
                    label: "Fortune",
                };
                Logger.log("Fortune resource added to CONFIG.COSMERE.resources");
            }

            Logger.log("Fortune Metalmind initialized");
        });
    },
};

export { Init };

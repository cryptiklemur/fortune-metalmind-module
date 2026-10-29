import { FortuneManager } from "../fortune-manager.ts";
import type { Listener } from "./index.ts";

const Rest: Listener = {
    listen(): void {
        Hooks.on("cosmere-rpg.rest", async (actor, type) => {
            if (type !== "long") return;
            if (!FortuneManager.settings.enableAutoRestDetection) return;

            await FortuneManager.longRest(actor as any);
        });
    },
};

export { Rest };

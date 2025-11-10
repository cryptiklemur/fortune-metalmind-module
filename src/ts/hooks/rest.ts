import { FortuneManager } from "../fortune-manager.ts";
import type { Listener } from "./index.ts";

const Rest: Listener = {
    listen(): void {
        Hooks.on("cosmere-rpg.rest", async (actor: unknown, _restData: unknown) => {
            const cosmereActor = actor as any;

            if (!FortuneManager.settings.enableAutoRestDetection) return;

            await FortuneManager.longRest(cosmereActor);
        });
    },
};

export { Rest };
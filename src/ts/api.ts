import type Module from "@client/packages/module.d.mts";
import type { FortuneManager } from "./fortune-manager.ts";

interface ThisModule extends Module {
    api: ThisApi;
}

interface ThisApi {
    FortuneManager: typeof FortuneManager;
}

export type { ThisModule, ThisApi };

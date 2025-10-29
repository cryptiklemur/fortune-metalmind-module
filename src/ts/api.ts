import type Module from "@client/packages/module.d.mts";
import { FortuneManager } from "./fortune-manager.ts";

interface ThisModule extends Module {
    api: ThisApi;
}

interface ThisApi {
    FortuneManager: typeof FortuneManager;
}

export { type ThisModule, type ThisApi };

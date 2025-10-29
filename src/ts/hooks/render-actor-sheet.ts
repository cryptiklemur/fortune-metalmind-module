import { Logger } from "../logger.ts";
import type { Listener } from "./index.ts";

const RenderActorSheet: Listener = {
    listen(): void {
        Hooks.on("renderActorSheetV2", async (app, _html) => {
            try {
                const sheet = app as { actor?: Actor };
                const actor = sheet.actor;

                if (!actor) return;

                Logger.debug("Actor sheet rendered", { actorName: actor.name });
            } catch (error) {
                Logger.error("Error in renderActorSheetV2:", error);
            }
        });
    },
};

export { RenderActorSheet };

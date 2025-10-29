import { Logger } from "../logger.ts";
import { Settings } from "../settings.ts";
import type { Listener } from "./index.ts";

const ActorReady: Listener = {
    listen(): void {
        Hooks.on("ready", () => {
            Logger.log("Initializing Fortune on all actors...");

            for (const actor of game.actors ?? []) {
                initializeFortune(actor);
            }
        });

        Hooks.on("createActor", (actor: unknown) => {
            initializeFortune(actor as Actor);
        });
    },
};

function initializeFortune(actor: Actor): void {
    const system = (actor as any).system;
    const settings = new Settings();

    if (!system?.resources) {
        Logger.warn("Actor has no resources object", { actorName: actor.name });
        return;
    }

    if (!system.resources.for) {
        const startingFortune = settings.startingFortune;
        const maximumFortune = settings.maximumFortune;

        const updates = {
            "system.resources.for": {
                value: startingFortune,
                max: {
                    value: maximumFortune,
                    useOverride: true,
                    override: maximumFortune,
                },
            },
        };

        actor.update(updates).then(() => {
            Logger.log("Initialized Fortune on actor", { actorName: actor.name });
        }).catch((error) => {
            Logger.error("Failed to initialize Fortune", { actorName: actor.name, error });
        });
    }
}

export { ActorReady };

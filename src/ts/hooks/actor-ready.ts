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

        Hooks.on("preCreateActor", (actor: unknown) => {
            const typed = actor as Actor;

            if (!needsFortune(typed)) return;

            (typed as any).updateSource(startingFortuneSource());
            Logger.log("Initialized Fortune on new actor", {
                actorName: typed.name,
            });
        });
    },
};

function needsFortune(actor: Actor): boolean {
    const system = (actor as any).system;

    if (!system?.resources) {
        Logger.warn("Actor has no resources object", { actorName: actor.name });
        return false;
    }

    return !system.resources.for?.max?.useOverride;
}

function startingFortuneSource(): Record<string, unknown> {
    const settings = new Settings();

    return {
        "system.resources.for.value": settings.startingFortune,
        "system.resources.for.max.useOverride": true,
        "system.resources.for.max.override": settings.maximumFortune,
    };
}

async function initializeFortune(actor: Actor): Promise<void> {
    if (!needsFortune(actor)) return;

    const settings = new Settings();

    try {
        await actor.update({
            "system.resources.for.max.useOverride": true,
            "system.resources.for.max.override": settings.maximumFortune,
        });
        await actor.update({
            "system.resources.for.value": settings.startingFortune,
        });

        Logger.log("Initialized Fortune on actor", { actorName: actor.name });
    } catch (error) {
        Logger.error("Failed to initialize Fortune", {
            actorName: actor.name,
            error,
        });
    }
}

export { ActorReady };

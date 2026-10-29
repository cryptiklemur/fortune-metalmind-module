import { Logger } from "../logger.ts";
import { Settings } from "../settings.ts";
import type { Listener } from "./index.ts";

const staleAdversaries: string[] = [];

const ActorReady: Listener = {
    listen(): void {
        Hooks.once("init", snapshotStaleAdversaries);

        Hooks.on("ready", async () => {
            if (!game.users?.activeGM?.isSelf) return;

            Logger.log("Initializing Fortune on character actors...");

            for (const actor of game.actors ?? []) {
                if (actor.type !== "character") continue;
                initializeFortune(actor);
            }

            await stripFortuneFromAdversaries();
        });

        Hooks.on("preCreateActor", (actor: unknown) => {
            const typed = actor as Actor;

            if (typed.type !== "character") return;
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

function snapshotStaleAdversaries(): void {
    for (const source of game.data?.actors ?? []) {
        if (source.type !== "adversary" || !source._id) continue;
        if ((source as any).system?.resources?.for === undefined) continue;

        staleAdversaries.push(source._id);
    }
}

async function stripFortuneFromAdversaries(): Promise<void> {
    if (!staleAdversaries.length) return;

    const updates = staleAdversaries.map((id) => ({
        _id: id,
        "system.resources.-=for": null,
    }));
    staleAdversaries.length = 0;

    try {
        await (globalThis as any).foundry.helpers.SocketInterface.dispatch(
            "modifyDocument",
            {
                type: "Actor",
                action: "update",
                operation: {
                    updates,
                    diff: false,
                    render: false,
                    modifiedTime: Date.now(),
                },
            },
        );

        Logger.log("Stripped the unused Fortune field from adversaries", {
            count: updates.length,
        });
    } catch (error) {
        Logger.error("Failed to strip Fortune from adversaries", { error });
    }
}

export { ActorReady };

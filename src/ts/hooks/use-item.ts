import { FortuneManager } from "../fortune-manager.ts";
import { Logger } from "../logger.ts";
import {
    type FortuneRowKind,
    isGeneratedRow,
    rowCost,
    rowKind,
    rowLabel,
} from "../rows/fortune-rows.ts";
import type { Listener } from "./index.ts";

async function announce(actor: any, content: string): Promise<void> {
    await ChatMessage.create({
        content,
        speaker: ChatMessage.getSpeaker({ actor }),
    });
}

async function tap(actor: any, item: any): Promise<void> {
    const cost = rowCost(item);
    const label = rowLabel(item);

    if (!(await FortuneManager.tapFortune(actor, cost))) return;

    const flavor = FortuneManager.settings.showTapFlavor
        ? `<p><em>${game.i18n.format("FortuneMetalmind.ChatFlavor.TapFortune", { actor: actor.name })}</em></p>`
        : "";

    await announce(
        actor,
        `${flavor}<p><strong>${actor.name}</strong> tapped their Fortune Metalmind: <em>${label}</em></p>`,
    );
}

async function store(actor: any): Promise<void> {
    if (!(await FortuneManager.convertOpportunity(actor))) return;

    await announce(
        actor,
        `<p><strong>${actor.name}</strong> stored an Opportunity as Fortune in their chromium medallion.</p>`,
    );
}

async function reconnect(actor: any): Promise<void> {
    const check = FortuneManager.canPerformRefocus(actor);

    if (!check.possible) {
        ui.notifications.warn(game.i18n.localize(check.reasonKey));
        return;
    }

    await announce(
        actor,
        `<p><strong>${actor.name}</strong> attempts to re-connect with their Fortune Metalmind...</p>`,
    );
    await FortuneManager.performRefocus(actor);
}

function run(actor: any, item: any, kind: FortuneRowKind): Promise<void> {
    switch (kind) {
        case "tap":
            return tap(actor, item);
        case "store":
            return store(actor);
        case "reconnect":
            return reconnect(actor);
    }
}

const inFlight = new Set<string>();

const UseItem: Listener = {
    listen(): void {
        Hooks.on("cosmere-rpg.preUseItem", (item: any) => {
            if (!isGeneratedRow(item)) return;

            const kind = rowKind(item);

            if (!kind || !item.actor) return false;

            const key = `${item.actor.id}:${item.id}`;

            if (inFlight.has(key)) return false;

            inFlight.add(key);

            run(item.actor, item, kind)
                .catch((error: unknown) =>
                    Logger.error("Fortune row action failed", {
                        rowName: item.name,
                        kind,
                        error,
                    }),
                )
                .finally(() => inFlight.delete(key));

            return false;
        });
    },
};

export { UseItem };

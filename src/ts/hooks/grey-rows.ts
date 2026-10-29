import { MODULE_ID } from "../constants.ts";
import { FortuneManager } from "../fortune-manager.ts";
import { Logger } from "../logger.ts";
import { COST_FLAG, ROW_FLAG } from "../rows/fortune-rows.ts";
import type { Listener } from "./index.ts";

const UNUSABLE_CLASS = "fortune-row-unusable";
const ROW_SELECTOR = '[data-section-id="fortune"] li.item[data-item-id]';

function isUsable(actor: Actor, kind: string, cost: unknown): boolean {
    switch (kind) {
        case "tap":
            return FortuneManager.canTapFortune(actor, Number(cost) || 0)
                .possible;
        case "store":
            return FortuneManager.canConvertOpportunity(actor).possible;
        case "reconnect":
            return FortuneManager.canPerformRefocus(actor).possible;
        default:
            return true;
    }
}

function greyRows(actor: Actor, root: HTMLElement): void {
    const items = (actor as any).items;

    for (const row of root.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
        const item = items?.get(row.dataset.itemId);
        const kind = item?.getFlag?.(MODULE_ID, ROW_FLAG);

        if (!kind) continue;

        row.classList.toggle(
            UNUSABLE_CLASS,
            !isUsable(actor, kind, item.getFlag(MODULE_ID, COST_FLAG)),
        );
    }
}

const GreyRows: Listener = {
    listen(): void {
        Hooks.on("renderActorSheetV2", (app, html) => {
            try {
                const actor = (app as { actor?: Actor }).actor;

                if (!actor) return;

                greyRows(actor, html as HTMLElement);
            } catch (error) {
                Logger.error("Failed to grey unusable Fortune rows", error);
            }
        });
    },
};

export { GreyRows };

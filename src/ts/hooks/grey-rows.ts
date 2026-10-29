import { FortuneManager } from "../fortune-manager.ts";
import { Logger } from "../logger.ts";
import { rowCost, rowKind, SECTION_ID } from "../rows/fortune-rows.ts";
import type { Listener } from "./index.ts";

const UNUSABLE_CLASS = "fortune-row-unusable";
const ROW_SELECTOR = `[data-section-id="${SECTION_ID}"] li.item[data-item-id]`;

function isUsable(data: any, kind: string, cost: number): boolean {
    switch (kind) {
        case "tap":
            return data.tapAvailable && data.current >= cost;
        case "store":
            return data.conversionsRemaining > 0 && data.current < data.max;
        case "reconnect":
            return data.refocusAvailable;
        default:
            return true;
    }
}

function greyRows(actor: Actor, root: HTMLElement): void {
    if ((actor as any).type !== "character") return;

    const items = (actor as any).items;
    const rows = root.querySelectorAll<HTMLElement>(ROW_SELECTOR);

    if (rows.length === 0) return;

    const data = FortuneManager.getFortuneData(actor as any);

    for (const row of rows) {
        const item = items?.get(row.dataset.itemId);
        const kind = rowKind(item);

        if (!kind) continue;

        row.classList.toggle(
            UNUSABLE_CLASS,
            !isUsable(data, kind, rowCost(item)),
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

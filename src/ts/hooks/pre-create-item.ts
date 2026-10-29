import { hasRowFlag } from "../rows/fortune-rows.ts";
import type { Listener } from "./index.ts";

const PreCreateItem: Listener = {
    listen(): void {
        Hooks.on("preCreateItem", (item: any) => {
            if (!hasRowFlag(item)) return;

            ui.notifications.warn(
                game.i18n.localize("FortuneMetalmind.Warnings.RowNotCopyable"),
            );

            return false;
        });
    },
};

export { PreCreateItem };

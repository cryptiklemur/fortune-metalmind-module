import { MODULE_ID } from "../constants.ts";
import { ROW_FLAG } from "../rows/fortune-rows.ts";
import type { Listener } from "./index.ts";

const PreCreateItem: Listener = {
    listen(): void {
        Hooks.on("preCreateItem", (item: any) => {
            if (!item?.getFlag?.(MODULE_ID, ROW_FLAG)) return;

            ui.notifications.warn(
                game.i18n.localize("FortuneMetalmind.Warnings.RowNotCopyable"),
            );

            return false;
        });
    },
};

export { PreCreateItem };

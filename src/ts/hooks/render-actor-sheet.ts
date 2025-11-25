import { FortuneDialog } from "../dialogs/fortune-dialog.ts";
import { Logger } from "../logger.ts";
import type { Listener } from "./index.ts";

const RenderActorSheet: Listener = {
    listen(): void {
        Hooks.on("renderActorSheetV2", async (app, html) => {
            try {
                const sheet = app as { actor?: Actor };
                const actor = sheet.actor;

                if (!actor) return;

                const $sheet = $(html as HTMLElement);
                const $fortuneControls = $sheet.find('.resource.for[data-id="for"] .controls');

                if ($fortuneControls.length > 0 && $fortuneControls.find('.fortune-action-btn').length === 0) {
                    const $fortuneBtn = $('<a role="button" class="fortune-action-btn" data-tooltip="Tap/Store Fortune"><i class="fa-solid fa-coins"></i></a>');

                    $fortuneControls.prepend($fortuneBtn);

                    $fortuneBtn.on("click", async (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        await FortuneDialog.show(actor);
                    });
                }
            } catch (error) {
                Logger.error("Error in renderActorSheetV2:", error);
            }
        });
    },
};

export { RenderActorSheet };

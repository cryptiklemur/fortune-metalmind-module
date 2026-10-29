/** biome-ignore-all lint/complexity/noStaticOnlyClass: matches the other entry points */
import { FortuneManager } from "../fortune-manager.ts";
import type { FortuneData, FortuneTapCost } from "../types/fortune-data.ts";

interface TapOption {
    cost: number;
    label: string;
    effect: string;
    customMacro?: string;
    customScript?: string;
}

function tapSection(data: FortuneData, options: TapOption[]): string {
    const buttons = options
        .map((option) => {
            const blocked = !data.tapAvailable || data.current < option.cost;

            return `
                <button type="button" class="fortune-tap-btn" data-action="tap"
                    data-cost="${option.cost}"
                    data-effect="${option.effect}"
                    data-macro="${option.customMacro || ""}"
                    data-script="${option.customScript || ""}"
                    ${blocked ? "disabled" : ""}>
                    <span class="option-label">${option.label}</span>
                    <span class="option-cost">${option.cost} Fortune</span>
                </button>`;
        })
        .join("");

    return `
        <div class="fortune-section">
            <h4>Tap Fortune</h4>
            ${buttons}
        </div>`;
}

function body(data: FortuneData, options: TapOption[]): string {
    const tapStatus = data.tapAvailable
        ? '<span class="tap-status available">Tap Available</span>'
        : '<span class="tap-status unavailable">Tap Used</span>';

    const storeBlocked =
        data.conversionsRemaining <= 0 || data.current >= data.max;

    return `
        <div class="fortune-dialog">
            <div class="fortune-header">
                <h3>Fortune: ${data.current}/${data.max}</h3>
                ${tapStatus}
            </div>

            ${tapSection(data, options)}

            <div class="fortune-section">
                <h4>Store Fortune</h4>
                <button type="button" class="fortune-store-btn" data-action="store"
                    ${storeBlocked ? "disabled" : ""}>
                    <span>Convert Opportunity to Fortune</span>
                    <span class="conversions-remaining">${data.conversionsRemaining}/${data.conversionsMax} remaining</span>
                </button>
            </div>

            <div class="fortune-section">
                <h4>Re-Connecting</h4>
                <button type="button" class="fortune-reconnect-btn" data-action="reconnect"
                    ${data.refocusAvailable ? "" : "disabled"}>
                    <span>Re-Connect with Fortune Metalmind</span>
                    <span class="reconnect-status">${data.refocusAvailable ? "Available" : "Used"}</span>
                </button>
            </div>
        </div>`;
}

async function announce(actor: Actor, content: string): Promise<void> {
    await ChatMessage.create({
        content,
        speaker: ChatMessage.getSpeaker({ actor: actor as any }),
    });
}

export class FortuneDialog {
    static async show(actor: Actor): Promise<void> {
        const data = FortuneManager.getFortuneData(actor as any);
        const options = FortuneManager.settings.tapOptions as TapOption[];

        const dialog = new (
            globalThis as any
        ).foundry.applications.api.DialogV2({
            window: { title: "Fortune Metalmind" },
            classes: ["fortune-metalmind"],
            position: { width: 400 },
            content: body(data, options),
            buttons: [
                { action: "close", label: "Close", icon: "fas fa-times" },
            ],
            actions: {
                tap: async function (
                    this: any,
                    _event: PointerEvent,
                    target: HTMLElement,
                ) {
                    const cost = Number.parseInt(
                        target.dataset.cost ?? "0",
                        10,
                    ) as FortuneTapCost;
                    const label =
                        target.querySelector(".option-label")?.textContent ??
                        "";

                    if (!(await FortuneManager.tapFortune(actor as any, cost)))
                        return;

                    await announce(
                        actor,
                        `<p><strong>${(actor as any).name}</strong> tapped their Fortune Metalmind: <em>${label}</em></p>`,
                    );
                    await this.close();
                },

                store: async function (this: any) {
                    if (
                        !(await FortuneManager.convertOpportunity(actor as any))
                    )
                        return;

                    await announce(
                        actor,
                        `<p><strong>${(actor as any).name}</strong> stored an Opportunity as Fortune in their chromium medallion.</p>`,
                    );
                    await this.close();
                },

                reconnect: async function (this: any) {
                    await announce(
                        actor,
                        `<p><strong>${(actor as any).name}</strong> attempts to re-connect with their Fortune Metalmind...</p>`,
                    );
                    await FortuneManager.performRefocus(actor as any);
                    await this.close();
                },
            },
        });

        await dialog.render({ force: true });
    }
}

import { MODULE_ID } from "../constants.ts";
import { FortuneManager } from "../fortune-manager.ts";
import { DEFAULT_REFOCUS_OUTCOMES, type RefocusOutcome } from "../settings.ts";

export class RefocusOutcomesForm extends (globalThis as any).FormApplication {
    static get defaultOptions(): any {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "fortune-refocus-outcomes",
            title: "Configure Refocus Outcomes",
            template:
                "modules/fortune-metalmind/templates/refocus-outcomes-form.hbs",
            width: 600,
            height: "auto",
            closeOnSubmit: true,
            submitOnChange: false,
            submitOnClose: false,
        });
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);

        html.find("button[name='reset']").on("click", async () => {
            const confirm = await (globalThis as any).Dialog.confirm({
                title: "Reset to Defaults",
                content:
                    "<p>Are you sure you want to reset Refocus Outcomes to defaults?</p>",
            });

            if (confirm) {
                await game.settings.set(
                    MODULE_ID,
                    "refocusOutcomes",
                    JSON.stringify(DEFAULT_REFOCUS_OUTCOMES, null, 2),
                );
                this.render();
            }
        });
    }

    getData(): object {
        return { outcomes: FortuneManager.settings.refocusOutcomes };
    }

    protected async _updateObject(_event: Event, formData: any): Promise<void> {
        const outcomes: RefocusOutcome[] = [];
        const expandedData = foundry.utils.expandObject(formData) as any;

        if (expandedData.outcomes) {
            for (const outcome of Object.values(
                expandedData.outcomes,
            ) as any[]) {
                outcomes.push({
                    min: Number(outcome.min),
                    max: Number(outcome.max),
                    fortuneDelta: Number(outcome.fortuneDelta),
                    restoreTap: Boolean(outcome.restoreTap),
                    description: outcome.description,
                });
            }
        }

        const validationError = this.validateOutcomes(outcomes);
        if (validationError) {
            ui.notifications?.error(validationError);
            throw new Error(validationError);
        }

        await game.settings.set(
            MODULE_ID,
            "refocusOutcomes",
            JSON.stringify(outcomes, null, 2),
        );
        ui.notifications?.info("Refocus Outcomes saved!");
    }

    private validateOutcomes(outcomes: RefocusOutcome[]): string | null {
        outcomes.sort((a, b) => a.min - b.min);

        for (let i = 0; i < outcomes.length; i++) {
            const current = outcomes[i];

            if (current.min > current.max) {
                return `Outcome ${i + 1}: Min (${current.min}) cannot be greater than Max (${current.max})`;
            }

            if (current.min < 1 || current.max > 20) {
                return `Outcome ${i + 1}: Dice ranges must be between 1 and 20`;
            }

            if (i > 0) {
                const previous = outcomes[i - 1];

                if (current.min <= previous.max) {
                    return `Outcomes ${i} and ${i + 1} overlap (${previous.min}-${previous.max} vs ${current.min}-${current.max})`;
                }

                if (current.min !== previous.max + 1) {
                    return `Gap detected between outcome ${i} (ends at ${previous.max}) and outcome ${i + 1} (starts at ${current.min})`;
                }
            }
        }

        if (outcomes[0]?.min !== 1) {
            return `First outcome must start at 1 (currently starts at ${outcomes[0]?.min})`;
        }

        if (outcomes[outcomes.length - 1]?.max !== 20) {
            return `Last outcome must end at 20 (currently ends at ${outcomes[outcomes.length - 1]?.max})`;
        }

        return null;
    }
}

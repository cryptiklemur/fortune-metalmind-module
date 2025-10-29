import { MODULE_ID } from "../constants.ts";
import type { TapOption } from "../settings.ts";

const DEFAULT_TAP_OPTIONS: TapOption[] = [
    {
        cost: 1,
        label: "Gain Advantage (1 Fortune)",
        description: "Gain advantage on your next roll",
        effect: "advantage",
    },
    {
        cost: 2,
        label: "Auto-Success (2 Fortune)",
        description: "Automatically succeed on your next roll (DM discretion)",
        effect: "auto-success",
    },
    {
        cost: 5,
        label: "Guaranteed Natural 20 (5 Fortune)",
        description: "Roll a guaranteed natural 20",
        effect: "guaranteed-nat20",
    },
];

export class TapOptionsForm extends (globalThis as any).FormApplication {
    static get defaultOptions(): any {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "fortune-tap-options",
            title: "Configure Fortune Tap Options",
            template: "modules/fortune-metalmind/templates/tap-options-form.hbs",
            width: 700,
            height: "auto",
            closeOnSubmit: true,
            submitOnChange: false,
            submitOnClose: false,
        });
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);

        html.find(".effect-select").on("change", (event) => {
            const index = $(event.currentTarget).data("index");
            const value = $(event.currentTarget).val() as string;
            const $macroField = html.find(`[data-custom-type="macro"][data-custom-index="${index}"]`);
            const $scriptField = html.find(`[data-custom-type="script"][data-custom-index="${index}"]`);

            if (value === "custom-macro") {
                $macroField.removeClass("hidden");
                $scriptField.addClass("hidden");
            } else if (value === "custom-script") {
                $macroField.addClass("hidden");
                $scriptField.removeClass("hidden");
            } else {
                $macroField.addClass("hidden");
                $scriptField.addClass("hidden");
            }
        });

        html.find(".add-option").on("click", async () => {
            const setting = game.settings.get(MODULE_ID, "tapOptions") as string;
            let options: TapOption[] = [];

            try {
                options = JSON.parse(setting);
            } catch {
                options = [];
            }

            const newOption: TapOption = {
                cost: 1,
                label: "",
                description: "",
                effect: "advantage",
            };

            options.push(newOption);
            await game.settings.set(MODULE_ID, "tapOptions", JSON.stringify(options, null, 2));
            this.render();
        });

        html.find(".remove-option").on("click", async (event) => {
            const index = $(event.currentTarget).data("index");
            const setting = game.settings.get(MODULE_ID, "tapOptions") as string;
            let options: TapOption[] = [];

            try {
                options = JSON.parse(setting);
            } catch {
                options = [];
            }

            options.splice(index, 1);
            await game.settings.set(MODULE_ID, "tapOptions", JSON.stringify(options, null, 2));
            this.render();
        });

        html.find("button[name='reset']").on("click", async () => {
            const confirm = await (globalThis as any).Dialog.confirm({
                title: "Reset to Defaults",
                content: "<p>Are you sure you want to reset Fortune Tap Options to defaults?</p>",
            });

            if (confirm) {
                await game.settings.set(MODULE_ID, "tapOptions", JSON.stringify(DEFAULT_TAP_OPTIONS, null, 2));
                this.render();
            }
        });
    }

    getData(): object {
        const setting = game.settings.get(MODULE_ID, "tapOptions") as string;
        let options: TapOption[] = [];

        try {
            options = JSON.parse(setting);
        } catch {
            options = [];
        }

        return {
            options,
            effectChoices: {
                advantage: "Advantage",
                "auto-success": "Automatic Success",
                "guaranteed-nat20": "Guaranteed Natural 20",
                "custom-macro": "Custom Macro",
                "custom-script": "Custom Script",
            },
        };
    }

    protected async _updateObject(_event: Event, formData: any): Promise<void> {
        const options: TapOption[] = [];
        const expandedData = foundry.utils.expandObject(formData) as any;

        if (expandedData.options) {
            for (const opt of Object.values(expandedData.options) as any[]) {
                const option: TapOption = {
                    cost: Number(opt.cost),
                    label: opt.label,
                    description: opt.description,
                    effect: opt.effect,
                };

                if (opt.effect === "custom-macro" && opt.customMacro) {
                    option.customMacro = opt.customMacro;
                }

                if (opt.effect === "custom-script" && opt.customScript) {
                    option.customScript = opt.customScript;
                }

                options.push(option);
            }
        }

        await game.settings.set(MODULE_ID, "tapOptions", JSON.stringify(options, null, 2));
        ui.notifications?.info("Fortune Tap Options saved!");
    }
}

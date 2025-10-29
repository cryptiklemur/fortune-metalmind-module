import { MODULE_ID } from "./constants.ts";
import { RefocusOutcomesForm } from "./forms/refocus-outcomes-form.ts";
import { TapOptionsForm } from "./forms/tap-options-form.ts";

interface TapOption {
    cost: number;
    label: string;
    description: string;
    effect:
        | "advantage"
        | "auto-success"
        | "guaranteed-nat20"
        | "custom-macro"
        | "custom-script";
    customMacro?: string;
    customScript?: string;
}

interface RefocusOutcome {
    min: number;
    max: number;
    fortuneDelta: number;
    restoreTap: boolean;
    description: string;
}

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

const DEFAULT_REFOCUS_OUTCOMES: RefocusOutcome[] = [
    {
        min: 1,
        max: 5,
        fortuneDelta: -1,
        restoreTap: false,
        description: "Refocus failed. Lost 1 Fortune point.",
    },
    {
        min: 6,
        max: 19,
        fortuneDelta: 0,
        restoreTap: true,
        description: "Refocus successful! Daily tap restored.",
    },
    {
        min: 20,
        max: 20,
        fortuneDelta: 2,
        restoreTap: true,
        description:
            "Perfect meditation! Daily tap restored and gained 2 Fortune points!",
    },
];

class Settings {
    #STARTING_FORTUNE = "startingFortune";
    #MAXIMUM_FORTUNE = "maximumFortune";
    #DAILY_TAPS_PER_REST = "dailyTapsPerRest";
    #FORTUNE_PER_OPPORTUNITY = "fortunePerOpportunity";
    #OPPORTUNITY_CONVERSIONS_PER_REST = "opportunityConversionsPerRest";
    #REFOCUS_ATTEMPTS_PER_REST = "refocusAttemptsPerRest";
    #TAP_OPTIONS = "tapOptions";
    #REFOCUS_OUTCOMES = "refocusOutcomes";
    #SHOW_TAP_FLAVOR = "showTapFlavor";
    #ENABLE_AUTO_REST_DETECTION = "enableAutoRestDetection";

    register(): void {
        game.settings.registerMenu(MODULE_ID, "tapOptionsMenu", {
            name: "FortuneMetalmind.Settings.TapOptionsMenu.Name",
            label: "FortuneMetalmind.Settings.TapOptionsMenu.Label",
            hint: "FortuneMetalmind.Settings.TapOptionsMenu.Hint",
            icon: "fas fa-hand-sparkles",
            type: TapOptionsForm as any,
            restricted: true,
        });

        game.settings.registerMenu(MODULE_ID, "refocusOutcomesMenu", {
            name: "FortuneMetalmind.Settings.RefocusOutcomesMenu.Name",
            label: "FortuneMetalmind.Settings.RefocusOutcomesMenu.Label",
            hint: "FortuneMetalmind.Settings.RefocusOutcomesMenu.Hint",
            icon: "fas fa-brain",
            type: RefocusOutcomesForm as any,
            restricted: true,
        });

        game.settings.register(MODULE_ID, this.#STARTING_FORTUNE, {
            name: "FortuneMetalmind.Settings.StartingFortune.Name",
            hint: "FortuneMetalmind.Settings.StartingFortune.Hint",
            scope: "world",
            config: true,
            default: 1,
            type: Number,
            range: { min: 0, max: 20, step: 1 } as any,
        });

        game.settings.register(MODULE_ID, this.#MAXIMUM_FORTUNE, {
            name: "FortuneMetalmind.Settings.MaximumFortune.Name",
            hint: "FortuneMetalmind.Settings.MaximumFortune.Hint",
            scope: "world",
            config: true,
            default: 5,
            type: Number,
            range: { min: 1, max: 50, step: 1 } as any,
        });

        game.settings.register(MODULE_ID, this.#DAILY_TAPS_PER_REST, {
            name: "FortuneMetalmind.Settings.DailyTapsPerRest.Name",
            hint: "FortuneMetalmind.Settings.DailyTapsPerRest.Hint",
            scope: "world",
            config: true,
            default: 1,
            type: Number,
            range: { min: 1, max: 10, step: 1 } as any,
        });

        game.settings.register(MODULE_ID, this.#FORTUNE_PER_OPPORTUNITY, {
            name: "FortuneMetalmind.Settings.FortunePerOpportunity.Name",
            hint: "FortuneMetalmind.Settings.FortunePerOpportunity.Hint",
            scope: "world",
            config: true,
            default: 1,
            type: Number,
            range: { min: 1, max: 10, step: 1 } as any,
        });

        game.settings.register(
            MODULE_ID,
            this.#OPPORTUNITY_CONVERSIONS_PER_REST,
            {
                name: "FortuneMetalmind.Settings.OpportunityConversionsPerRest.Name",
                hint: "FortuneMetalmind.Settings.OpportunityConversionsPerRest.Hint",
                scope: "world",
                config: true,
                default: 3,
                type: Number,
                range: { min: 1, max: 20, step: 1 } as any,
            },
        );

        game.settings.register(MODULE_ID, this.#REFOCUS_ATTEMPTS_PER_REST, {
            name: "FortuneMetalmind.Settings.RefocusAttemptsPerRest.Name",
            hint: "FortuneMetalmind.Settings.RefocusAttemptsPerRest.Hint",
            scope: "world",
            config: true,
            default: 1,
            type: Number,
            range: { min: 1, max: 10, step: 1 } as any,
        });

        game.settings.register(MODULE_ID, this.#TAP_OPTIONS, {
            name: "FortuneMetalmind.Settings.TapOptions.Name",
            hint: "FortuneMetalmind.Settings.TapOptions.Hint",
            scope: "world",
            config: false,
            default: JSON.stringify(DEFAULT_TAP_OPTIONS, null, 2),
            type: String,
        });

        game.settings.register(MODULE_ID, this.#REFOCUS_OUTCOMES, {
            name: "FortuneMetalmind.Settings.RefocusOutcomes.Name",
            hint: "FortuneMetalmind.Settings.RefocusOutcomes.Hint",
            scope: "world",
            config: false,
            default: JSON.stringify(DEFAULT_REFOCUS_OUTCOMES, null, 2),
            type: String,
        });

        game.settings.register(MODULE_ID, this.#SHOW_TAP_FLAVOR, {
            name: "FortuneMetalmind.Settings.ShowTapFlavor.Name",
            hint: "FortuneMetalmind.Settings.ShowTapFlavor.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });

        game.settings.register(MODULE_ID, this.#ENABLE_AUTO_REST_DETECTION, {
            name: "FortuneMetalmind.Settings.AutoRestDetection.Name",
            hint: "FortuneMetalmind.Settings.AutoRestDetection.Hint",
            scope: "world",
            config: true,
            default: true,
            type: Boolean,
        });
    }

    get startingFortune(): number {
        return game.settings.get(MODULE_ID, this.#STARTING_FORTUNE) as number;
    }

    get maximumFortune(): number {
        return game.settings.get(MODULE_ID, this.#MAXIMUM_FORTUNE) as number;
    }

    get dailyTapsPerRest(): number {
        return game.settings.get(
            MODULE_ID,
            this.#DAILY_TAPS_PER_REST,
        ) as number;
    }

    get fortunePerOpportunity(): number {
        return game.settings.get(
            MODULE_ID,
            this.#FORTUNE_PER_OPPORTUNITY,
        ) as number;
    }

    get opportunityConversionsPerRest(): number {
        return game.settings.get(
            MODULE_ID,
            this.#OPPORTUNITY_CONVERSIONS_PER_REST,
        ) as number;
    }

    get refocusAttemptsPerRest(): number {
        return game.settings.get(
            MODULE_ID,
            this.#REFOCUS_ATTEMPTS_PER_REST,
        ) as number;
    }

    get tapOptions(): TapOption[] {
        const json = game.settings.get(MODULE_ID, this.#TAP_OPTIONS) as string;
        try {
            return JSON.parse(json);
        } catch {
            return DEFAULT_TAP_OPTIONS;
        }
    }

    get refocusOutcomes(): RefocusOutcome[] {
        const json = game.settings.get(
            MODULE_ID,
            this.#REFOCUS_OUTCOMES,
        ) as string;
        try {
            return JSON.parse(json);
        } catch {
            return DEFAULT_REFOCUS_OUTCOMES;
        }
    }

    get showTapFlavor(): boolean {
        return game.settings.get(MODULE_ID, this.#SHOW_TAP_FLAVOR) as boolean;
    }

    get enableAutoRestDetection(): boolean {
        return game.settings.get(
            MODULE_ID,
            this.#ENABLE_AUTO_REST_DETECTION,
        ) as boolean;
    }
}

export { Settings, type TapOption, type RefocusOutcome };

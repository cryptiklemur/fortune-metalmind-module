import { MODULE_ID } from "./constants.ts";

class Settings {
    #SHOW_TAP_FLAVOR = "showTapFlavor";
    #ENABLE_AUTO_REST_DETECTION = "enableAutoRestDetection";

    register(): void {
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

export { Settings };

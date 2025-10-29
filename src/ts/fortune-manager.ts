import { MODULE_ID } from "./constants.ts";
import {
    DEFAULT_FORTUNE_DATA,
    type FortuneData,
    FortuneTapCost,
} from "./types/fortune-data.ts";

export class FortuneManager {
    static readonly FLAG_KEY = "fortuneData";

    static getFortuneData(actor: Actor): FortuneData {
        const data = actor.getFlag(MODULE_ID, this.FLAG_KEY) as
            | FortuneData
            | undefined;
        return data
            ? { ...DEFAULT_FORTUNE_DATA, ...data }
            : { ...DEFAULT_FORTUNE_DATA };
    }

    static async setFortuneData(
        actor: Actor,
        data: Partial<FortuneData>,
    ): Promise<void> {
        const current = this.getFortuneData(actor);
        const updated = { ...current, ...data };
        await actor.setFlag(MODULE_ID, this.FLAG_KEY, updated);
    }

    static async adjustFortune(actor: Actor, delta: number): Promise<boolean> {
        const data = this.getFortuneData(actor);
        const newCurrent = Math.max(
            0,
            Math.min(data.max, data.current + delta),
        );

        if (newCurrent === data.current) {
            return false;
        }

        await this.setFortuneData(actor, { current: newCurrent });
        return true;
    }

    static async tapFortune(
        actor: Actor,
        cost: FortuneTapCost,
    ): Promise<boolean> {
        const data = this.getFortuneData(actor);

        if (!data.tapAvailable) {
            ui.notifications.warn(
                game.i18n.localize("FortuneMetalmind.Warnings.TapNotAvailable"),
            );
            return false;
        }

        if (data.current < cost) {
            ui.notifications.warn(
                game.i18n.localize(
                    "FortuneMetalmind.Warnings.InsufficientFortune",
                ),
            );
            return false;
        }

        await this.setFortuneData(actor, {
            current: data.current - cost,
            tapAvailable: false,
        });

        return true;
    }

    static async convertOpportunity(actor: Actor): Promise<boolean> {
        const data = this.getFortuneData(actor);

        if (data.conversionsRemaining <= 0) {
            ui.notifications.warn(
                game.i18n.localize(
                    "FortuneMetalmind.Warnings.NoConversionsRemaining",
                ),
            );
            return false;
        }

        if (data.current >= data.max) {
            ui.notifications.warn(
                game.i18n.localize("FortuneMetalmind.Warnings.FortuneAtMax"),
            );
            return false;
        }

        await this.setFortuneData(actor, {
            current: data.current + 1,
            conversionsRemaining: data.conversionsRemaining - 1,
        });

        return true;
    }

    static async performRefocus(actor: Actor): Promise<void> {
        const data = this.getFortuneData(actor);

        if (!data.refocusAvailable) {
            ui.notifications.warn(
                game.i18n.localize(
                    "FortuneMetalmind.Warnings.RefocusNotAvailable",
                ),
            );
            return;
        }

        const roll = await new Roll("1d20").evaluate();
        const result = roll.total;

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.localize("FortuneMetalmind.Refocus.RollFlavor"),
        });

        if (result >= 1 && result <= 5) {
            await this.setFortuneData(actor, {
                current: Math.max(0, data.current - 1),
                refocusAvailable: false,
            });
            ui.notifications.info(
                game.i18n.localize("FortuneMetalmind.Refocus.Failure"),
            );
        } else if (result >= 6 && result <= 19) {
            await this.setFortuneData(actor, {
                tapAvailable: true,
                refocusAvailable: false,
            });
            ui.notifications.info(
                game.i18n.localize("FortuneMetalmind.Refocus.Success"),
            );
        } else if (result === 20) {
            await this.setFortuneData(actor, {
                current: Math.min(data.max, data.current + 2),
                tapAvailable: true,
                refocusAvailable: false,
            });
            ui.notifications.info(
                game.i18n.localize("FortuneMetalmind.Refocus.CriticalSuccess"),
            );
        }
    }

    static async longRest(actor: Actor): Promise<void> {
        await this.setFortuneData(actor, {
            tapAvailable: true,
            conversionsRemaining: DEFAULT_FORTUNE_DATA.conversionsMax,
            refocusAvailable: true,
        });
    }
}

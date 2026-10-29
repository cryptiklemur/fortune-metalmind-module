/** biome-ignore-all lint/complexity/noStaticOnlyClass: Fine here */
import { MODULE_ID } from "./constants.ts";
import { Logger } from "./logger.ts";
import { Settings } from "./settings.ts";
import {
    DEFAULT_FORTUNE_DATA,
    type FortuneData,
    type FortuneTapCost,
} from "./types/fortune-data.ts";

export type FortuneActionCheck =
    | { possible: true }
    | { possible: false; reasonKey: string };

export class FortuneManager {
    static readonly FLAG_KEY = "fortuneData";
    static settings = new Settings();

    static getFortuneData(actor: Actor): FortuneData {
        const systemResources = (actor as any).system?.resources?.for || {};
        const flagData = actor.getFlag(MODULE_ID, FortuneManager.FLAG_KEY) as
            | Partial<FortuneData>
            | undefined;

        const result: FortuneData = {
            current:
                systemResources.value ??
                FortuneManager.settings.startingFortune,
            max: systemResources.max?.useOverride
                ? FortuneManager.settings.maximumFortune
                : (systemResources.max?.value ?? 0),
            tapAvailable:
                flagData?.tapAvailable ?? DEFAULT_FORTUNE_DATA.tapAvailable,
            conversionsRemaining:
                flagData?.conversionsRemaining ??
                FortuneManager.settings.opportunityConversionsPerRest,
            conversionsMax:
                FortuneManager.settings.opportunityConversionsPerRest,
            refocusAvailable:
                flagData?.refocusAvailable ??
                DEFAULT_FORTUNE_DATA.refocusAvailable,
        };

        Logger.debug("getFortuneData", { actorName: actor.name, data: result });
        return result;
    }

    static async setFortuneData(
        actor: Actor,
        data: Partial<FortuneData>,
    ): Promise<void> {
        const current = FortuneManager.getFortuneData(actor);
        const updated = { ...current, ...data };
        Logger.debug("setFortuneData", {
            actorName: actor.name,
            before: current,
            after: updated,
        });

        const updates: Record<string, unknown> = {};

        if (data.current !== undefined || data.max !== undefined) {
            const existingMax =
                (actor as any).system?.resources?.for?.max || {};
            updates["system.resources.for"] = {
                value: updated.current,
                max: {
                    useOverride: existingMax.useOverride ?? true,
                    override: updated.max,
                },
            };
        }

        const flagUpdates: Partial<FortuneData> = {
            tapAvailable: updated.tapAvailable,
            conversionsRemaining: updated.conversionsRemaining,
            conversionsMax: updated.conversionsMax,
            refocusAvailable: updated.refocusAvailable,
        };

        await Promise.all([
            Object.keys(updates).length > 0
                ? actor.update(updates)
                : Promise.resolve(),
            actor.setFlag(MODULE_ID, FortuneManager.FLAG_KEY, flagUpdates),
        ]);
    }

    static async adjustFortune(actor: Actor, delta: number): Promise<boolean> {
        const data = FortuneManager.getFortuneData(actor);
        const newCurrent = Math.max(
            0,
            Math.min(data.max, data.current + delta),
        );

        if (newCurrent === data.current) {
            return false;
        }

        await FortuneManager.setFortuneData(actor, { current: newCurrent });
        return true;
    }

    static canTapFortune(
        actor: Actor,
        cost: FortuneTapCost,
    ): FortuneActionCheck {
        const data = FortuneManager.getFortuneData(actor);

        if (!data.tapAvailable) {
            return {
                possible: false,
                reasonKey: "FortuneMetalmind.Warnings.TapNotAvailable",
            };
        }

        if (data.current < cost) {
            return {
                possible: false,
                reasonKey: "FortuneMetalmind.Warnings.InsufficientFortune",
            };
        }

        return { possible: true };
    }

    static async tapFortune(
        actor: Actor,
        cost: FortuneTapCost,
    ): Promise<boolean> {
        Logger.log("tapFortune", { actorName: actor.name, cost });
        const data = FortuneManager.getFortuneData(actor);
        const check = FortuneManager.canTapFortune(actor, cost);

        if (!check.possible) {
            Logger.warn("tapFortune failed", {
                actorName: actor.name,
                current: data.current,
                cost,
                reasonKey: check.reasonKey,
            });
            ui.notifications.warn(game.i18n.localize(check.reasonKey));
            return false;
        }

        await FortuneManager.setFortuneData(actor, {
            current: data.current - cost,
            tapAvailable: false,
        });

        Logger.log("tapFortune success", {
            actorName: actor.name,
            newCurrent: data.current - cost,
        });
        return true;
    }

    static canConvertOpportunity(actor: Actor): FortuneActionCheck {
        const data = FortuneManager.getFortuneData(actor);

        if (data.conversionsRemaining <= 0) {
            return {
                possible: false,
                reasonKey: "FortuneMetalmind.Warnings.NoConversionsRemaining",
            };
        }

        if (data.current >= data.max) {
            return {
                possible: false,
                reasonKey: "FortuneMetalmind.Warnings.FortuneAtMax",
            };
        }

        return { possible: true };
    }

    static async convertOpportunity(actor: Actor): Promise<boolean> {
        const data = FortuneManager.getFortuneData(actor);
        const fortuneGain = FortuneManager.settings.fortunePerOpportunity;
        const check = FortuneManager.canConvertOpportunity(actor);

        if (!check.possible) {
            ui.notifications.warn(game.i18n.localize(check.reasonKey));
            return false;
        }

        await FortuneManager.setFortuneData(actor, {
            current: Math.min(data.max, data.current + fortuneGain),
            conversionsRemaining: data.conversionsRemaining - 1,
        });

        return true;
    }

    static canPerformRefocus(actor: Actor): FortuneActionCheck {
        const data = FortuneManager.getFortuneData(actor);

        if (!data.refocusAvailable) {
            return {
                possible: false,
                reasonKey: "FortuneMetalmind.Warnings.RefocusNotAvailable",
            };
        }

        return { possible: true };
    }

    static async performRefocus(actor: Actor): Promise<void> {
        Logger.log("performRefocus", { actorName: actor.name });
        const data = FortuneManager.getFortuneData(actor);
        const check = FortuneManager.canPerformRefocus(actor);

        if (!check.possible) {
            Logger.warn("performRefocus failed", {
                actorName: actor.name,
                reasonKey: check.reasonKey,
            });
            ui.notifications.warn(game.i18n.localize(check.reasonKey));
            return;
        }

        const roll = await new Roll("1d20").evaluate();
        const result = roll.total;
        Logger.log("performRefocus rolled", { actorName: actor.name, result });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.localize("FortuneMetalmind.Refocus.RollFlavor"),
        });

        const outcomes = FortuneManager.settings.refocusOutcomes;
        const outcome = outcomes.find(
            (o) => result >= o.min && result <= o.max,
        );

        if (outcome) {
            const updates: Partial<FortuneData> = {
                refocusAvailable: false,
            };

            if (outcome.fortuneDelta !== 0) {
                updates.current = Math.max(
                    0,
                    Math.min(data.max, data.current + outcome.fortuneDelta),
                );
            }

            if (outcome.restoreTap) {
                updates.tapAvailable = true;
            }

            await FortuneManager.setFortuneData(actor, updates);
            ui.notifications.info(outcome.description);
        }
    }

    static async longRest(actor: Actor): Promise<void> {
        Logger.log("longRest", { actorName: actor.name });
        await FortuneManager.setFortuneData(actor, {
            tapAvailable: true,
            conversionsRemaining:
                FortuneManager.settings.opportunityConversionsPerRest,
            refocusAvailable: true,
        });
        Logger.log("longRest complete", { actorName: actor.name });
    }
}

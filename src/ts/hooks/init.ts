import type { ThisModule } from "../api.ts";
import { MODULE_ID } from "../constants.ts";
import { FortuneManager } from "../fortune-manager.ts";
import { HandlebarHelpers } from "../handlebar-helpers.ts";
import { Logger } from "../logger.ts";
import { registerFortuneRows } from "../rows/fortune-rows.ts";
import { Settings } from "../settings.ts";
import type { Listener } from "./index.ts";

const Init: Listener = {
    listen(): void {
        Hooks.once("init", () => {
            new Settings().register();
            new HandlebarHelpers().register();

            (game.modules.get(MODULE_ID) as ThisModule).api = {
                FortuneManager,
            };

            if (!(globalThis as any).CONFIG?.COSMERE?.resources) {
                Logger.warn(
                    "CONFIG.COSMERE.resources not found - Cosmere RPG system may not be loaded",
                );
            } else {
                (globalThis as any).CONFIG.COSMERE.resources.for = {
                    key: "for",
                    label: "Fortune",
                    modes: {
                        character: { default: "override", valid: ["override"] },
                        adversary: { default: "override", valid: ["override"] },
                    },
                };
                Logger.log(
                    "Fortune resource added to CONFIG.COSMERE.resources",
                );

                addFortuneToActorSchemas();
                registerFortuneRows();
            }

            Logger.log("Fortune Metalmind initialized");
        });
    },
};

function addFortuneToActorSchemas(): void {
    const dataModels = (globalThis as any).CONFIG?.Actor?.dataModels;

    if (!dataModels) {
        Logger.warn(
            "CONFIG.Actor.dataModels not found - cannot add Fortune to the actor schema",
        );
        return;
    }

    for (const [actorType, model] of Object.entries(dataModels) as [
        string,
        any,
    ][]) {
        const defineSchema = model.defineSchema.bind(model);

        model.defineSchema = () => {
            const schema = defineSchema();
            const resources = schema.resources;

            if (!resources?.fields?.foc) {
                Logger.warn(
                    "Actor schema has no resources.foc to model Fortune on",
                    { actorType },
                );
                return schema;
            }

            if ("for" in resources.fields) return schema;

            const fields = (globalThis as any).foundry.data.fields;
            const DerivedValueField =
                resources.fields.foc.fields.max.constructor;
            const count = () =>
                new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0,
                });

            const fortune = new fields.SchemaField({
                value: count(),
                max: new DerivedValueField(count()),
                bonus: new fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                }),
            });

            fortune.name = "for";
            fortune.parent = resources;
            resources.fields.for = fortune;

            return schema;
        };

        if (Object.hasOwn(model, "_schema")) {
            Logger.warn(
                "Actor schema was already built before Fortune could be added",
                { actorType },
            );
        }
    }

    Logger.log("Fortune added to actor schemas", {
        actorTypes: Object.keys(dataModels),
    });
}

export { Init };

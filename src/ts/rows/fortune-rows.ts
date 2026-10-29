import { MODULE_ID } from "../constants.ts";
import { FortuneManager } from "../fortune-manager.ts";
import { Logger } from "../logger.ts";

type FortuneRowKind = "tap" | "store" | "reconnect";

interface FortuneRowData {
    _id: string;
    type: "action";
    name: string;
    system: Record<string, unknown>;
    flags: Record<string, unknown>;
}

const SECTION_ID = "fortune";
const SECTION_SORT_ORDER = 550;
const SECTION_LABEL = "FortuneMetalmind.Display.Fortune";
const ROW_FLAG = "row";
const COST_FLAG = "cost";
const LABEL_FLAG = "label";
const FORTUNE_RESOURCE = "for";
const FREE_ACTION = "fre";
const SPECIAL_ACTION = "spe";
const TAP_SORT_CHAR = "​";
const STORE_SORT_KEY = "⁠";
const RECONNECT_SORT_KEY = "⁠⁠";
const MAX_COST_SORT_STEPS = 50;

const reportedOrphans = new Set<string>();

let resourceAsserted = false;

function registerFortuneRows(): void {
    registerSection();
    wrapPrepareData();
}

function registerSection(): void {
    const api = (globalThis as any).cosmereRPG?.api;

    if (!api?.registerActionListSection) {
        Logger.warn(
            "cosmereRPG.api.registerActionListSection not found - Fortune rows will have no section",
        );
        return;
    }

    const registered = api.registerActionListSection({
        source: MODULE_ID,
        id: SECTION_ID,
        sortOrder: SECTION_SORT_ORDER,
        label: SECTION_LABEL,
        itemTypeLabel: SECTION_LABEL,
        default: false,
        filter: isGeneratedRow,
    });

    if (!registered) {
        Logger.warn("Fortune actions section was refused by cosmere-rpg");
        return;
    }

    Logger.log("Fortune actions section registered");
}

function wrapPrepareData(): void {
    const documentClass = (globalThis as any).CONFIG?.Actor?.documentClass;

    if (!documentClass?.prototype?.prepareData) {
        Logger.warn(
            "CONFIG.Actor.documentClass has no prepareData - cannot generate Fortune rows",
        );
        return;
    }

    const original = documentClass.prototype.prepareData;

    documentClass.prototype.prepareData = function (
        this: any,
        ...args: unknown[]
    ): unknown {
        const result = original.apply(this, args);

        if (this.type !== "character") return result;

        try {
            injectRows(this);
        } catch (error) {
            Logger.error("Failed to generate Fortune action rows", {
                actorName: this.name,
                error,
            });
        }

        return result;
    };
}

function injectRows(actor: any): void {
    const ItemClass = (globalThis as any).CONFIG.Item.documentClass;
    const collection = actor.getEmbeddedCollection("Item");
    const rows = buildRows();

    pruneRows(collection);

    for (const data of rows) {
        const row = new ItemClass(data, { parent: actor });
        assertFortuneResourceOnce(actor, row);
        collection.set(row.id, row, { modifySource: false });
    }
}

function hasRowFlag(item: any): boolean {
    return !!item?.getFlag?.(MODULE_ID, ROW_FLAG);
}

function rowKind(item: any): FortuneRowKind | undefined {
    return item?.getFlag?.(MODULE_ID, ROW_FLAG) as FortuneRowKind | undefined;
}

function rowCost(item: any): number {
    return Number(item?.getFlag?.(MODULE_ID, COST_FLAG) ?? 0);
}

function rowLabel(item: any): string {
    return String(item?.getFlag?.(MODULE_ID, LABEL_FLAG) ?? "");
}

function isPersisted(item: any): boolean {
    return !!item?.parent?._source?.items?.some(
        (data: any) => data._id === item.id,
    );
}

function isGeneratedRow(item: any): boolean {
    return hasRowFlag(item) && !isPersisted(item);
}

function pruneRows(collection: any): void {
    for (const item of Array.from(collection) as any[]) {
        if (!hasRowFlag(item)) continue;

        if (isPersisted(item)) {
            reportOrphanRow(item);
            continue;
        }

        collection.delete(item.id, { modifySource: false });
    }
}

function reportOrphanRow(item: any): void {
    if (reportedOrphans.has(item.id)) return;

    reportedOrphans.add(item.id);

    Logger.warn(
        "A persisted copy of a Fortune row is on an actor - leaving it visible so the player can delete it",
        {
            actorName: item.parent?.name,
            itemId: item.id,
            itemName: item.name,
        },
    );
}

function costSortKey(cost: number): string {
    const steps = Math.max(0, Math.min(Math.trunc(cost), MAX_COST_SORT_STEPS));
    return TAP_SORT_CHAR.repeat(steps);
}

function buildRows(): FortuneRowData[] {
    const tapPrefix = game.i18n.localize("FortuneMetalmind.Tap.Title");

    const byCost = [...FortuneManager.settings.tapOptions].sort(
        (a, b) => a.cost - b.cost,
    );

    const taps = byCost.map((option, index) => ({
        _id: rowId(`tap${index.toString().padStart(4, "0")}`),
        type: "action" as const,
        name: `${costSortKey(option.cost)}${tapPrefix}: ${option.label}`,
        system: {
            description: { value: option.description },
            activation: {
                type: "utility",
                cost: { type: FREE_ACTION },
                consumption: [
                    {
                        type: "resource",
                        resource: FORTUNE_RESOURCE,
                        value: {
                            min: option.cost,
                            max: option.cost,
                            actual: option.cost,
                        },
                    },
                ],
            },
        },
        flags: rowFlags("tap", option.cost, option.label),
    }));

    return [
        ...taps,
        {
            _id: rowId("store"),
            type: "action" as const,
            name: `${STORE_SORT_KEY}${game.i18n.localize("FortuneMetalmind.Opportunity.Convert")}`,
            system: {
                description: {
                    value: game.i18n.localize(
                        "FortuneMetalmind.Opportunity.Description",
                    ),
                },
                activation: {
                    type: "utility",
                    cost: { type: FREE_ACTION },
                    consumption: [],
                },
            },
            flags: rowFlags("store"),
        },
        {
            _id: rowId("recon"),
            type: "action" as const,
            name: `${RECONNECT_SORT_KEY}${game.i18n.localize("FortuneMetalmind.Refocus.Button")}`,
            system: {
                description: {
                    value: game.i18n.localize(
                        "FortuneMetalmind.Refocus.Description",
                    ),
                },
                activation: {
                    type: "utility",
                    cost: { type: SPECIAL_ACTION },
                    consumption: [],
                },
            },
            flags: rowFlags("reconnect"),
        },
    ];
}

function rowFlags(
    kind: FortuneRowKind,
    cost?: number,
    label?: string,
): Record<string, unknown> {
    return {
        [MODULE_ID]: {
            [ROW_FLAG]: kind,
            ...(cost === undefined ? {} : { [COST_FLAG]: cost }),
            ...(label === undefined ? {} : { [LABEL_FLAG]: label }),
        },
    };
}

function rowId(suffix: string): string {
    return `fmfortune${suffix}`.padEnd(16, "0");
}

function assertFortuneResourceOnce(actor: any, row: any): void {
    if (resourceAsserted) return;

    const consume = row.system?.activation?.consumption?.[0];

    if (consume?.type !== "resource") return;

    resourceAsserted = true;

    if (consume.resource === FORTUNE_RESOURCE) return;

    Logger.error(
        "Fortune row consumption fell back to another resource - the cost column and any system-side deduction are wrong",
        {
            actorName: actor.name,
            rowId: row.id,
            rowName: row.name,
            resource: consume.resource,
        },
    );
}

export {
    hasRowFlag,
    isGeneratedRow,
    registerFortuneRows,
    rowCost,
    rowKind,
    rowLabel,
    SECTION_ID,
};
export type { FortuneRowKind };

import { bar, expect, test } from "./foundry.ts";

const visibleName = (raw: string | null) =>
    (raw ?? "").replace(/[​⁠]/g, "").trim();

const TAP_ROW = "fmfortunetap0000";
const EXPENSIVE_TAP_ROW = "fmfortunetap0002";
const STORE_ROW = "fmfortunestore00";
const RECONNECT_ROW = "fmfortunerecon00";

test.describe("fortune rows on the cosmere actions tab", () => {
    test("renders a row per tap option plus Store Fortune and Re-Connect", async ({
        page,
        character,
    }) => {
        const tapOptionCount = await page.evaluate(
            () =>
                JSON.parse(
                    globalThis.game.settings.get(
                        "fortune-metalmind",
                        "tapOptions",
                    ) as string,
                ).length,
        );

        await character.openActionsTab();

        await expect(character.fortuneRows).toHaveCount(tapOptionCount + 2);

        const section = character.sheet.locator('[data-section-id="fortune"]');
        await expect(section).toContainText("Store Fortune");
        await expect(section).toContainText("Re-Connect");
    });

    test("shows a tap row's price in the cost column", async ({
        character,
    }) => {
        await character.openActionsTab();

        const row = character.sheet.locator(`[data-item-id="${TAP_ROW}"]`);
        await expect(row.locator(".detail.extrawide")).toHaveText("1 Fortune");
    });

    test("greys a tap row the character cannot afford", async ({
        character,
    }) => {
        await character.openActionsTab();

        const affordable = character.sheet.locator(
            `[data-item-id="${TAP_ROW}"]`,
        );
        const unaffordable = character.sheet.locator(
            `[data-item-id="${EXPENSIVE_TAP_ROW}"]`,
        );

        await expect(affordable).not.toHaveClass(/fortune-row-unusable/);
        await expect(unaffordable).toHaveClass(/fortune-row-unusable/);
    });

    test("taps fortune in one click, with no consume dialog", async ({
        page,
        character,
        settings,
    }) => {
        await character.useRow(TAP_ROW);

        await expect(character.fortuneBar).toHaveText(
            bar(settings.start - 1, settings.max),
        );
        await expect(page.locator(".application.dialog")).toHaveCount(0);
        await expect
            .poll(() => character.chatText())
            .toContain("tapped their Fortune Metalmind");
    });

    test("stores an opportunity from its row", async ({
        character,
        settings,
    }) => {
        await character.useRow(STORE_ROW);

        await expect(character.fortuneBar).toHaveText(
            bar(settings.start + 1, settings.max),
        );
        await expect
            .poll(() => character.chatText())
            .toContain("stored an Opportunity as Fortune");
    });

    test("refuses a second tap and leaves fortune alone", async ({
        character,
        settings,
    }) => {
        await character.useRow(TAP_ROW);
        await expect(character.fortuneBar).toHaveText(
            bar(settings.start - 1, settings.max),
        );

        await character.useRow(TAP_ROW);

        await expect(character.notifications).toContainText(
            "Fortune tap already used",
        );
        await expect(character.fortuneBar).toHaveText(
            bar(settings.start - 1, settings.max),
        );
    });

    test("re-connects once, then refuses and posts nothing more", async ({
        page,
        character,
    }) => {
        await character.useRow(RECONNECT_ROW);

        await expect
            .poll(() =>
                page.evaluate(
                    (id) =>
                        globalThis.game.actors
                            .get(id)
                            ?.getFlag("fortune-metalmind", "fortuneData")
                            ?.refocusRemaining,
                    character.id,
                ),
            )
            .toBe(0);

        const posted = await character.chatText();
        expect(posted).toContain("attempts to re-connect");
        await character.useRow(RECONNECT_ROW);

        await expect(character.notifications).toContainText(
            "Re-Connect already used",
        );
        expect(await character.chatText()).toBe(posted);
    });

    test("adds a row when a tap option is added, with no reload", async ({
        character,
        tapOptionsControl,
    }) => {
        await character.openActionsTab();
        const options = await tapOptionsControl.get();

        await tapOptionsControl.set([
            ...options,
            {
                cost: 3,
                label: "Extra Tap",
                description: "a fourth tap option added for this test",
                effect: "advantage",
            },
        ]);

        await expect(
            character.sheet.locator('[data-item-id="fmfortunetap0003"]'),
        ).toHaveCount(1);
        await expect(character.fortuneRows).toHaveCount(options.length + 1 + 2);
    });

    test("removes a row when its tap option is removed", async ({
        character,
        tapOptionsControl,
    }) => {
        await character.openActionsTab();
        const options = await tapOptionsControl.get();

        await tapOptionsControl.set(options.slice(0, -1));

        await expect(
            character.sheet.locator(`[data-item-id="${EXPENSIVE_TAP_ROW}"]`),
        ).toHaveCount(0);
        await expect(character.fortuneRows).toHaveCount(options.length - 1 + 2);
    });

    test("strips a saved trailing price suffix from a tap option's row name", async ({
        character,
        tapOptionsControl,
    }) => {
        await character.openActionsTab();
        const options = await tapOptionsControl.get();
        options[0] = { ...options[0], label: "Gain Advantage (1 Fortune)" };

        await tapOptionsControl.set(options);

        const name = await character.sheet
            .locator(`[data-item-id="${TAP_ROW}"] .name`)
            .textContent();
        expect(visibleName(name)).toBe("Tap Fortune: Gain Advantage");
    });

    test("orders the rows by tap cost, then Store Fortune, then Re-Connect", async ({
        character,
    }) => {
        await character.openActionsTab();

        const rendered = await character.fortuneRows
            .locator(".name")
            .allTextContents();

        expect(rendered.map(visibleName)).toEqual([
            "Tap Fortune: Gain Advantage",
            "Tap Fortune: Auto-Success",
            "Tap Fortune: Guaranteed Natural 20",
            "Store Fortune",
            "Re-Connect",
        ]);
    });

    test("orders the taps by cost even when the gm configures them out of order", async ({
        character,
        page,
        tapOptionsControl,
    }) => {
        await character.openActionsTab();
        const options = await tapOptionsControl.get();

        await tapOptionsControl.set([...options].reverse());

        const costs = await page.evaluate((actorId) => {
            const actor = (globalThis as any).game.actors.get(actorId);
            return actor.items
                .filter(
                    (item: any) =>
                        item.getFlag("fortune-metalmind", "row") === "tap",
                )
                .map((item: any) => item.getFlag("fortune-metalmind", "cost"));
        }, character.id);

        expect(costs).toEqual([1, 2, 5]);
    });

    test("matches a search that spans the prefix and the label", async ({
        character,
        page,
    }) => {
        await character.openActionsTab();

        const matched = await page.evaluate((actorId) => {
            const actor = (globalThis as any).game.actors.get(actorId);
            const query = "fortune: gain";
            return actor.items
                .filter((item: any) => item.name.toLowerCase().includes(query))
                .map((item: any) => item.id);
        }, character.id);

        expect(matched).toContain(TAP_ROW);
    });

    test("spends fortune once when a tap row is double clicked", async ({
        character,
        page,
        settings,
    }) => {
        await character.openActionsTab();

        const before = await page.evaluate(
            (actorId) =>
                (globalThis as any).game.messages.contents.filter(
                    (m: any) => m.speaker?.actor === actorId,
                ).length,
            character.id,
        );

        const row = character.rowUseButton(TAP_ROW);
        await Promise.all([row.click(), row.click()]);

        await expect(character.fortuneBar).toHaveText(
            bar(settings.start - 1, settings.max),
        );

        const after = await page.evaluate(
            (actorId) =>
                (globalThis as any).game.messages.contents.filter(
                    (m: any) => m.speaker?.actor === actorId,
                ).length,
            character.id,
        );
        expect(after - before).toBe(1);
    });

    test("refuses a dragged copy of a generated row", async ({
        character,
        page,
    }) => {
        await character.openActionsTab();

        const result = await page.evaluate((actorId) => {
            const actor = (globalThis as any).game.actors.get(actorId);
            const data = actor.items.get("fmfortunetap0000").toObject();
            delete data._id;
            return actor
                .createEmbeddedDocuments("Item", [data])
                .then((made: unknown[]) => ({
                    created: made.length,
                    persisted: actor._source.items.length,
                }));
        }, character.id);

        expect(result.created).toBe(0);
        expect(result.persisted).toBe(0);
    });

    test("allows as many taps per rest as the gm configured", async ({
        character,
        numberSettings,
        page,
        settings,
    }) => {
        await numberSettings.set("dailyTapsPerRest", 2);
        await page.evaluate(async (actorId) => {
            const actor = (globalThis as any).game.actors.get(actorId);
            await actor.update({ "system.resources.for.value": 3 });
        }, character.id);
        await character.openActionsTab();

        await character.useRow(TAP_ROW);
        await expect(character.fortuneBar).toHaveText(bar(2, settings.max));

        await character.useRow(TAP_ROW);
        await expect(character.fortuneBar).toHaveText(bar(1, settings.max));

        await character.useRow(TAP_ROW);
        await expect(character.notifications).toContainText(
            "Fortune tap already used",
        );
        await expect(character.fortuneBar).toHaveText(bar(1, settings.max));
    });

    test("allows as many re-connects per rest as the gm configured", async ({
        character,
        numberSettings,
        page,
    }) => {
        const remaining = () =>
            page.evaluate(
                (id) =>
                    (globalThis as any).game.actors
                        .get(id)
                        ?.getFlag("fortune-metalmind", "fortuneData")
                        ?.refocusRemaining,
                character.id,
            );

        await numberSettings.set("refocusAttemptsPerRest", 2);
        await character.openActionsTab();

        await character.useRow(RECONNECT_ROW);
        await expect.poll(remaining).toBe(1);

        await character.useRow(RECONNECT_ROW);
        await expect.poll(remaining).toBe(0);

        await character.useRow(RECONNECT_ROW);
        await expect(character.notifications).toContainText(
            "Re-Connect already used",
        );
    });

    test("reads a world saved before taps became a counter as spent", async ({
        character,
        page,
    }) => {
        await page.evaluate(async (actorId) => {
            const actor = (globalThis as any).game.actors.get(actorId);
            await actor.setFlag("fortune-metalmind", "fortuneData", {
                tapAvailable: false,
            });
        }, character.id);

        await character.useRow(TAP_ROW);

        await expect(character.notifications).toContainText(
            "Fortune tap already used",
        );
    });
});

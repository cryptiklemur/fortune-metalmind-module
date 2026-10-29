import { expect, test } from "./foundry.ts";

const bar = (current: number, max: number) =>
    new RegExp(`^\\s*${current}\\s*/\\s*${max}\\s*$`);

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
                            ?.refocusAvailable,
                    character.id,
                ),
            )
            .toBe(false);

        const posted = await character.chatText();
        expect(posted).toContain("attempts to re-connect");
        await character.useRow(RECONNECT_ROW);

        await expect(character.notifications).toContainText(
            "Re-Connect already used",
        );
        expect(await character.chatText()).toBe(posted);
    });
});

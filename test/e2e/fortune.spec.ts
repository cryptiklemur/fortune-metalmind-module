import { bar, expect, test } from "./foundry.ts";

test.describe("fortune on a character sheet", () => {
    test("shows the fortune bar with the actor's starting value and maximum", async ({
        character,
        settings,
    }) => {
        await expect(character.fortuneBar).toHaveText(
            bar(settings.start, settings.max),
        );
    });

    test("repairs an actor's fortune that was never set, on world reload", async ({
        page,
        character,
        settings,
    }) => {
        test.setTimeout(90_000);

        await page.evaluate(async (actorId) => {
            const actor = globalThis.game.actors.get(actorId);
            await actor?.update({
                "system.resources.for.max.useOverride": false,
                "system.resources.for.value": 0,
            });
        }, character.id);

        await expect(character.fortuneBar).not.toHaveText(
            bar(settings.start, settings.max),
        );

        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => globalThis.game?.ready === true, {
            timeout: 60_000,
            polling: 500,
        });
        await page.evaluate(async (actorId) => {
            const actor = globalThis.game.actors.get(actorId);
            await actor?.sheet.render(true);
        }, character.id);
        await page.waitForTimeout(2000);

        await expect(character.fortuneBar).toHaveText(
            bar(settings.start, settings.max),
        );
    });
});

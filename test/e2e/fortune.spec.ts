import { expect, test } from "./foundry.ts";

const bar = (current: number, max: number) =>
    new RegExp(`^\\s*${current}\\s*/\\s*${max}\\s*$`);

test.describe("fortune on a character sheet", () => {
    test("shows the fortune bar and the tap button", async ({
        character,
        settings,
    }) => {
        await expect(character.fortuneBar).toHaveText(
            bar(settings.start, settings.max),
        );
        await expect(character.fortuneButton).toHaveCount(1);
    });

    test("adds fortune when an opportunity is stored", async ({
        page,
        character,
        settings,
    }) => {
        await character.fortuneButton.click();
        await page.locator(".fortune-store-btn").click();

        await expect(character.fortuneBar).toHaveText(
            bar(settings.start + 1, settings.max),
        );
    });

    test("removes fortune when the metalmind is tapped", async ({
        page,
        character,
        settings,
    }) => {
        await character.fortuneButton.click();
        await page.locator('.fortune-tap-btn[data-cost="1"]').click();

        await expect(character.fortuneBar).toHaveText(
            bar(settings.start - 1, settings.max),
        );
    });

    test("blocks a tap that costs more fortune than the actor has", async ({
        page,
        character,
        settings,
    }) => {
        await character.fortuneButton.click();

        const tooExpensive = page.locator(
            `.fortune-tap-btn[data-cost="${settings.max}"]`,
        );
        await expect(tooExpensive).toBeDisabled();
        await expect(character.fortuneBar).toHaveText(
            bar(settings.start, settings.max),
        );
    });

    test("rolls a re-connect and closes the dialog", async ({
        page,
        character,
    }) => {
        await character.fortuneButton.click();
        await page.locator(".fortune-reconnect-btn").click();

        await expect(page.locator(".application.dialog")).toHaveCount(0);

        const rolled = await page.evaluate(
            (id) =>
                globalThis.game.messages.contents.some(
                    (message: { speaker?: { actor?: string } }) =>
                        message.speaker?.actor === id,
                ),
            character.id,
        );
        expect(rolled).toBe(true);
    });
});

import type { Page } from "@playwright/test";
import { expect, test } from "./foundry.ts";

const TAP_ROW = "fmfortunetap0000";

const tapsRemaining = (page: Page, actorId: string) =>
    page.evaluate(
        (id: string) =>
            (globalThis as any).game.actors
                .get(id)
                ?.getFlag("fortune-metalmind", "fortuneData")?.tapsRemaining,
        actorId,
    );

const rest = (page: Page, actorId: string, method: "shortRest" | "longRest") =>
    page.evaluate(
        async ({ id, call }: { id: string; call: string }) => {
            const actor = (globalThis as any).game.actors.get(id);
            await actor[call]({ dialog: false });
        },
        { id: actorId, call: method },
    );

test.describe("restoring fortune on a rest", () => {
    test("leaves a spent tap spent after a short rest", async ({
        character,
        page,
    }) => {
        await character.useRow(TAP_ROW);
        await expect.poll(() => tapsRemaining(page, character.id)).toBe(0);

        await rest(page, character.id, "shortRest");

        await expect.poll(() => tapsRemaining(page, character.id)).toBe(0);
    });

    test("restores a spent tap after a long rest", async ({
        character,
        page,
    }) => {
        await character.useRow(TAP_ROW);
        await expect.poll(() => tapsRemaining(page, character.id)).toBe(0);

        await rest(page, character.id, "longRest");

        await expect.poll(() => tapsRemaining(page, character.id)).toBe(1);
    });
});

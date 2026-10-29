import { expect, test } from "./foundry.ts";

const PLANT = {
    value: 3,
    max: { derived: 0, override: 5, useOverride: true, bonus: 0 },
    bonus: 0,
};

const NAMES = ["e2e stale adversary", "e2e live character"];

test.describe("fortune belongs to characters only", () => {
    test.afterEach(async ({ world }) => {
        await world.evaluate(async (names) => {
            const g = globalThis as any;
            for (const actor of [...g.game.actors]) {
                if (names.includes(actor.name)) await actor.delete();
            }
        }, NAMES);
    });

    test("a stale adversary loses its fortune field on world load, a character keeps its own", async ({
        world,
    }) => {
        const { adversaryId, characterId } = await world.evaluate(
            async ({ plant, names }) => {
                const g = globalThis as any;
                const adversary = await g.Actor.create({
                    name: names[0],
                    type: "adversary",
                });
                const character = await g.Actor.create({
                    name: names[1],
                    type: "character",
                });

                await g.foundry.helpers.SocketInterface.dispatch(
                    "modifyDocument",
                    {
                        type: "Actor",
                        action: "update",
                        operation: {
                            updates: [
                                {
                                    _id: adversary.id,
                                    "system.resources.for": plant,
                                },
                            ],
                            diff: false,
                            render: false,
                            modifiedTime: Date.now(),
                        },
                    },
                );

                return {
                    adversaryId: adversary.id as string,
                    characterId: character.id as string,
                };
            },
            { plant: PLANT, names: NAMES },
        );

        const stored = (id: string) =>
            world.evaluate(async (actorId) => {
                const g = globalThis as any;
                const response =
                    await g.foundry.helpers.SocketInterface.dispatch(
                        "modifyDocument",
                        {
                            type: "Actor",
                            action: "get",
                            operation: { query: { _id: actorId } },
                        },
                    );
                return response.result?.[0]?.system?.resources?.for ?? null;
            }, id);

        expect(await stored(adversaryId)).not.toBeNull();
        const characterFortune = await stored(characterId);
        expect(characterFortune).not.toBeNull();

        await world.reload({ waitUntil: "domcontentloaded" });
        await world.waitForFunction(() => globalThis.game?.ready === true, {
            timeout: 180_000,
            polling: 1000,
        });
        await world.waitForTimeout(3000);

        expect(await stored(adversaryId)).toBeNull();
        expect(await stored(characterId)).toEqual(characterFortune);

        const bars = await world.evaluate((actorId) => {
            const g = globalThis as any;
            return Object.keys(
                g.game.actors.get(actorId).system.resources,
            ) as string[];
        }, adversaryId);
        expect(bars).not.toContain("for");
    });
});

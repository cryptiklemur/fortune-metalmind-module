import { test as base, type Locator, type Page } from "@playwright/test";
import type { TapOption } from "../../src/ts/settings.ts";

const FOUNDRY_URL = process.env.FOUNDRY_URL ?? "http://0.0.0.0:31000";
const WORLD = process.env.FOUNDRY_WORLD ?? "fortune-test";
const MODULE_ID = "fortune-metalmind";
const TAP_OPTIONS_SETTING = "tapOptions";

const bar = (current: number, max: number): RegExp =>
    new RegExp(`^\\s*${current}\\s*/\\s*${max}\\s*$`);

export interface Character {
    id: string;
    sheet: Locator;
    fortuneBar: Locator;
    notifications: Locator;
    fortuneRows: Locator;
    rowUseButton(rowId: string): Locator;
    useRow(rowId: string): Promise<void>;
    openActionsTab(): Promise<void>;
    chatText(): Promise<string>;
}

export interface NumberSettings {
    set(key: string, value: number): Promise<void>;
}

export interface TapOptionsControl {
    get(): Promise<TapOption[]>;
    set(options: TapOption[]): Promise<void>;
}

async function signIn(page: Page): Promise<void> {
    const admin = process.env.FOUNDRY_ADMIN_KEY;
    if (!admin) throw new Error("FOUNDRY_ADMIN_KEY is not set");

    await page.goto(FOUNDRY_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    if (page.url().includes("/license")) {
        await page.waitForSelector("#eula-agree", { timeout: 20_000 });
        await page.locator("#eula-agree").check();
        await page.locator("#sign").click();
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(3000);
    }

    if (page.url().includes("/auth")) {
        await page.waitForSelector('input[type="password"]', {
            timeout: 20_000,
        });
        await page.locator('input[type="password"]').first().fill(admin);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(3000);
    }
}

async function launchWorld(page: Page): Promise<void> {
    if (!page.url().includes("/setup")) return;

    const row = page.locator(`[data-package-id="${WORLD}"]`);
    await row.waitFor({ timeout: 20_000 });
    await page.evaluate(() => {
        for (const overlay of document.querySelectorAll(".tour-overlay")) {
            overlay.remove();
        }
    });
    await row.hover({ force: true });
    await page.waitForTimeout(500);
    await row.locator('a[data-action="worldLaunch"]').click({ force: true });
    await page.waitForURL(/\/(join|game)/, { timeout: 120_000 });
    await page.waitForTimeout(3000);
}

const GAMEMASTER_SESSION_REAP_TIMEOUT = 90_000;

async function waitForGamemasterSlotToFree(
    select: Locator,
    gamemaster: string,
): Promise<void> {
    try {
        await select.page().waitForFunction(
            (label) => {
                const option = Array.from(
                    document.querySelectorAll('select[name="userid"] option'),
                ).find((o) => o.textContent?.trim() === label);
                return option !== undefined && !option.disabled;
            },
            gamemaster,
            { timeout: GAMEMASTER_SESSION_REAP_TIMEOUT, polling: 1000 },
        );
    } catch (error) {
        throw new Error(
            `user "${gamemaster}" still has an active session in world "${WORLD}" after ${GAMEMASTER_SESSION_REAP_TIMEOUT}ms`,
            { cause: error },
        );
    }
}

async function joinAsGamemaster(page: Page): Promise<void> {
    if (!page.url().includes("/join")) return;

    const select = page.locator('select[name="userid"]');
    await select.waitFor({ timeout: 30_000 });
    const options = await select.locator("option").allTextContents();
    const gamemaster = options.find((o) => /gamemaster/i.test(o));
    if (!gamemaster) throw new Error(`world "${WORLD}" has no Gamemaster user`);

    await waitForGamemasterSlotToFree(select, gamemaster.trim());
    await select.selectOption({ label: gamemaster });
    await page.locator('#join-game-form button[name="join"]').click();
    await page.waitForURL(/\/game/, { timeout: 120_000 });
    await page.waitForFunction(() => globalThis.game?.ready === true, {
        timeout: 180_000,
        polling: 1000,
    });
}

async function enterWorld(page: Page): Promise<void> {
    await signIn(page);
    await launchWorld(page);
    await joinAsGamemaster(page);
}

async function closeWithoutThrowing(page: Page): Promise<void> {
    try {
        await page.close();
    } catch {}
}

async function activateModule(page: Page): Promise<void> {
    const active = await page.evaluate(
        (id) => globalThis.game.modules.get(id)?.active ?? false,
        MODULE_ID,
    );
    if (active) return;

    await page.evaluate(async (id) => {
        const config = {
            ...globalThis.game.settings.get("core", "moduleConfiguration"),
        };
        config[id] = true;
        await globalThis.game.settings.set(
            "core",
            "moduleConfiguration",
            config,
        );
    }, MODULE_ID);

    await page.waitForTimeout(2000);
    await enterWorld(page);

    const nowActive = await page.evaluate(
        (id) => globalThis.game.modules.get(id)?.active ?? false,
        MODULE_ID,
    );
    if (!nowActive) {
        throw new Error(`could not activate ${MODULE_ID} in world "${WORLD}"`);
    }
}

export const test = base.extend<
    {
        character: Character;
        numberSettings: NumberSettings;
        settings: { start: number; max: number };
        tapOptionsControl: TapOptionsControl;
    },
    { world: Page }
>({
    world: [
        async ({ browser }, use) => {
            const page = await browser.newPage({
                viewport: { width: 1920, height: 1080 },
            });
            await enterWorld(page);
            await activateModule(page);
            await use(page);
            await closeWithoutThrowing(page);
        },
        { scope: "worker", timeout: 300_000 },
    ],

    page: async ({ world }, use) => {
        await use(world);
    },

    settings: async ({ world }, use) => {
        const settings = await world.evaluate(
            (id) => ({
                start: globalThis.game.settings.get(
                    id,
                    "startingFortune",
                ) as number,
                max: globalThis.game.settings.get(
                    id,
                    "maximumFortune",
                ) as number,
            }),
            MODULE_ID,
        );
        await use(settings);
    },

    numberSettings: async ({ world }, use) => {
        const original = new Map<string, number>();

        const write = (key: string, value: number): Promise<void> =>
            world.evaluate(
                async ({ id, key, value }) => {
                    await globalThis.game.settings.set(id, key, value);
                },
                { id: MODULE_ID, key, value },
            );

        await use({
            async set(key: string, value: number): Promise<void> {
                if (!original.has(key)) {
                    original.set(
                        key,
                        await world.evaluate(
                            ({ id, key }) =>
                                globalThis.game.settings.get(id, key) as number,
                            { id: MODULE_ID, key },
                        ),
                    );
                }
                await write(key, value);
            },
        });

        for (const [key, value] of original) {
            await write(key, value);
        }
    },

    tapOptionsControl: async ({ world }, use) => {
        const read = (): Promise<string> =>
            world.evaluate(
                ({ id, setting }) =>
                    globalThis.game.settings.get(id, setting) as string,
                { id: MODULE_ID, setting: TAP_OPTIONS_SETTING },
            );

        const write = (json: string): Promise<void> =>
            world.evaluate(
                async ({ id, setting, json }) => {
                    await globalThis.game.settings.set(id, setting, json);
                },
                { id: MODULE_ID, setting: TAP_OPTIONS_SETTING, json },
            );

        const original = await read();

        await use({
            async get(): Promise<TapOption[]> {
                return JSON.parse(await read());
            },
            set(options: TapOption[]): Promise<void> {
                return write(JSON.stringify(options));
            },
        });

        await write(original);
    },

    character: async ({ world }, use, testInfo) => {
        const name = `e2e ${testInfo.testId}`;
        const { id, elementId } = await world.evaluate(async (actorName) => {
            const actor = await globalThis.Actor.create({
                name: actorName,
                type: "character",
            });
            await actor.sheet.render(true);
            await new Promise((settle) => setTimeout(settle, 2000));
            const element = actor.sheet.element;
            const root =
                element instanceof HTMLElement ? element : element?.[0];
            return { id: actor.id, elementId: root.id };
        }, name);

        const sheet = world.locator(`#${elementId}`);

        await world.evaluate(() => {
            for (const note of document.querySelectorAll("#notifications li")) {
                note.remove();
            }
        });

        await use({
            id,
            sheet,
            fortuneBar: sheet.locator('.resource.for[data-id="for"] .value'),
            notifications: world.locator("#notifications"),
            fortuneRows: sheet.locator(
                '[data-section-id="fortune"] li.item[data-item-id]',
            ),

            async openActionsTab(): Promise<void> {
                await sheet.locator('nav a[data-tab="actions"]').click();
            },

            rowUseButton(rowId: string): Locator {
                return sheet.locator(
                    `[data-section-id="fortune"] [data-item-id="${rowId}"] [data-action="use-item"]`,
                );
            },

            async useRow(rowId: string): Promise<void> {
                await sheet.locator('nav a[data-tab="actions"]').click();
                await this.rowUseButton(rowId).click();
            },

            chatText(): Promise<string> {
                return world.evaluate(
                    (actorId) =>
                        globalThis.game.messages.contents
                            .filter(
                                (message: { speaker?: { actor?: string } }) =>
                                    message.speaker?.actor === actorId,
                            )
                            .map(
                                (message: { content?: string }) =>
                                    message.content ?? "",
                            )
                            .join("\n"),
                    id,
                );
            },
        });

        await world.evaluate(async () => {
            const { DialogV2 } = globalThis.foundry.applications.api;
            for (const app of globalThis.foundry.applications.instances.values()) {
                if (app instanceof DialogV2) await app.close();
            }
        });

        await world.evaluate(async (actorId) => {
            const actor = globalThis.game.actors.get(actorId);
            await actor?.sheet.close();
            await actor?.delete();
        }, id);
    },
});

export { bar };
export { expect } from "@playwright/test";

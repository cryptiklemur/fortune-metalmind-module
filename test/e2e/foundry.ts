import { test as base, type Locator, type Page } from "@playwright/test";

const FOUNDRY_URL = process.env.FOUNDRY_URL ?? "http://0.0.0.0:31000";
const WORLD = process.env.FOUNDRY_WORLD ?? "fortune-test";
const MODULE_ID = "fortune-metalmind";

export interface Character {
    id: string;
    sheet: Locator;
    fortuneBar: Locator;
    fortuneButton: Locator;
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
    await row.hover();
    await page.waitForTimeout(500);
    await row.locator('a[data-action="worldLaunch"]').click({ force: true });
    await page.waitForURL(/\/(join|game)/, { timeout: 120_000 });
    await page.waitForTimeout(3000);
}

async function joinAsGamemaster(page: Page): Promise<void> {
    if (!page.url().includes("/join")) return;

    const select = page.locator('select[name="userid"]');
    await select.waitFor({ timeout: 30_000 });
    const options = await select.locator("option").allTextContents();
    const gamemaster = options.find((o) => /gamemaster/i.test(o));
    if (!gamemaster) throw new Error(`world "${WORLD}" has no Gamemaster user`);

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
    { character: Character; settings: { start: number; max: number } },
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
            await page.close();
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
        await use({
            id,
            sheet,
            fortuneBar: sheet.locator('.resource.for[data-id="for"] .value'),
            fortuneButton: sheet.locator(".fortune-action-btn"),
        });

        await world.evaluate(async (actorId) => {
            const actor = globalThis.game.actors.get(actorId);
            await actor?.sheet.close();
            await actor?.delete();
        }, id);
    },
});

export { expect } from "@playwright/test";

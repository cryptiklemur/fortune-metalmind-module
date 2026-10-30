# Fortune Metalmind

A Foundry VTT module for the [Cosmere RPG system](https://github.com/the-metalworks/cosmere-rpg). It adds a custom "Chromium Metalmind" that stores Fortune, as a homebrew rule defined in [How it works](#how-it-works).

A player spends Fortune points on a better outcome. The GM picks which options exist and what each one costs.

## Installation

1. Install from Foundry's module browser, or paste the manifest URL from the [latest release](https://github.com/cryptiklemur/fortune-metalmind-module/releases/latest).
2. Enable the module in a Cosmere RPG world.

Fortune then appears on every character sheet in that world.

## How it works

Fortune is a resource bar on the character sheet, next to Health, Focus and Investiture. Players and GMs can edit its current and maximum values.

The module adds a **Fortune** section to the Actions tab. That section shows one row per tap option, named `Tap Fortune: <label>`, with its cost in the Cost column. Below the tap rows:

- **Store Fortune** converts an Opportunity into Fortune.
- **Re-Connect** rolls a d20 to try to regain a spent tap.

Clicking a row runs it immediately, with no confirmation dialog. A row the character cannot use right now turns grey, and clicking it warns the player instead of spending. That happens when they cannot afford the cost, or when they have used up their taps or conversions. Editing the tap options updates the rows at once, with no reload.

Each row posts a chat message. Everyone at the table sees Fortune being spent.

Tapping Fortune spends the points and announces what the player bought, but the module does not apply the advantage, the automatic success or the natural 20 to the roll. The GM adjudicates the result.

Fortune belongs to player characters. Adversaries do not get Fortune rows or a Fortune bar.

A long rest refills taps, Opportunity conversions and Re-Connect attempts. Short rests leave them alone.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| Starting Fortune | 1 | Fortune a new character begins with |
| Maximum Fortune | 5 | Cap on stored Fortune |
| Daily Taps Per Long Rest | 1 | Taps allowed between long rests |
| Fortune Per Opportunity | 1 | Fortune gained per Opportunity converted |
| Opportunity Conversions Per Long Rest | 3 | Conversions allowed between long rests |
| Re-Connect Attempts Per Long Rest | 1 | Re-Connect rolls allowed between long rests |
| Show Fortune Tap Flavor | On | Adds a flavor line to the tap chat message |
| Auto-Detect Long Rests | On | Refills Fortune when a Cosmere long rest completes |

The **Fortune Tap Options** editor controls what a tap buys. Each entry has a cost, a label and a description, and each one becomes its own row. A label that ends in a price, such as `Gain Advantage (1 Fortune)`, still works, because the module strips that suffix when it reads the label. The defaults:

- Gain Advantage, 1 Fortune.
- Auto-Success, 2 Fortune.
- Guaranteed Natural 20, 5 Fortune.

The **Re-Connecting Outcomes** editor maps each d20 range to a result. The editor rejects ranges that overlap, leave a gap, or fail to cover 1 through 20. The defaults:

- 1 to 5, lose 1 Fortune.
- 6 to 19, regain the tap.
- 20, regain the tap and gain 2 Fortune.

## API

```javascript
const { FortuneManager } = game.modules.get('fortune-metalmind').api;

FortuneManager.getFortuneData(actor);
await FortuneManager.setFortuneData(actor, { current: 3, max: 5 });
await FortuneManager.adjustFortune(actor, 1);
await FortuneManager.tapFortune(actor, cost);
await FortuneManager.convertOpportunity(actor);
await FortuneManager.performRefocus(actor);
await FortuneManager.longRest(actor);
```

## Compatibility

- Foundry VTT 13.350 or later. Verified on 13.351.
- Cosmere RPG 2.0.0 or later. Verified on 3.1.2.

## Not built yet

A tap does not change a roll. Wiring that up means hooking the Cosmere RPG roll workflow, which the Metalworks team is still reworking.

The tap options editor also saves a custom macro or script per option, which the module does not run yet.

The module does not watch rolls for natural 20s or plot die Opportunities. Converting an Opportunity is manual, through the Store Fortune row.

## Credits

The Fortune Metalmind homebrew mechanic, built for the Cosmere Roleplaying Game.

## License

MIT

# Fortune Metalmind

A FoundryVTT module that adds the Chromium Metalmind (Fortune) homebrew mechanic to the [Cosmere RPG system](https://github.com/the-metalworks/cosmere-rpg).

## What is Fortune?

Fortune is a homebrew mechanic that represents a Chromium Metalmind - a metalmind that stores luck and fortune. Characters can tap their Fortune to gain advantages on rolls, automatically succeed at tasks, or even guarantee critical successes.

### Core Mechanic

- **Fortune Points**: Characters have a pool of Fortune points (default: starts at 1, max of 5)
- **Chromium Resource**: Fortune appears as a native resource on character sheets, just like Health, Focus, and Investiture
- **Customizable**: GMs can configure starting values, maximums, and how Fortune mechanics work

## Current Features

### Fortune Resource Integration

- **Native Resource**: Fortune appears as a resource bar on character sheets with chrome/silver coloring
- **Editable Values**: Players and GMs can adjust current and maximum Fortune values
- **Persistent**: Fortune data is stored in actor system data and persists across sessions

### Tap, Store & Re-Connect

Click the coins icon next to the Fortune resource to open a dialog with:
- **Tap Fortune**: Spend Fortune for configured effects (manual application - see Future Plans for automatic roll integration)
- **Store Fortune**: Convert Opportunities to Fortune (respects conversion limits)
- **Re-Connect**: Meditate to attempt regaining your daily tap (d20 roll with configurable outcomes)

All actions post to chat for transparency.

### Long Rest Integration

Automatically restores Fortune abilities when completing a long rest:
- Daily tap limit restored
- Re-connect ability restored
- Opportunity conversions reset

### Configuration System

Highly configurable settings accessible through Foundry's module settings:

- **Starting Fortune**: How much Fortune new characters begin with (default: 1)
- **Maximum Fortune**: Cap on Fortune storage (default: 5)
- **Daily Taps Per Rest**: How many times Fortune can be tapped per long rest (default: 1)
- **Fortune Per Opportunity**: How much Fortune gained from converting Opportunities (default: 1)
- **Opportunity Conversions Per Rest**: Conversion limit (default: 3 per long rest)
- **Refocus Attempts Per Rest**: Meditation attempts to regain Fortune tap (default: 1 per long rest)

### Advanced Configuration

- **Tap Options Editor**: Visual form to configure what players can spend Fortune on
  - Default options: Advantage (1 Fortune), Auto-Success (2 Fortune), Guaranteed Nat20 (5 Fortune)
  - Support for custom macros and JavaScript scripts
  - Add/remove options as needed

- **Refocus Outcomes Editor**: Configure the results of Refocus meditation based on d20 rolls
  - Default: 1-5 (lose 1 Fortune), 6-19 (regain tap), 20 (regain tap + gain 2 Fortune)
  - Validate dice ranges to prevent gaps or overlaps

## Future Plans

### Roll Integration (Pending)

The module includes prepared (but currently disabled) Fortune tap mechanics that will integrate with the Cosmere RPG roll system once the system's roll workflow is refactored by the Metalworks team.

**Planned Features**:
- Fortune tap UI injected into roll configuration dialogs
- Spend Fortune to gain advantages on skill checks
- Automatic success without rolling
- Guaranteed natural 20 results
- Custom macro/script execution on Fortune tap

**Status**: Waiting for the Metalworks team to complete their roll system redesign before implementing roll integration.

### Automatic Opportunity Detection

- Automatically detect natural 20s and plot die Opportunities
- Offer players the choice to convert Opportunities to Fortune (currently manual via dialog)

## Installation

1. Install from Foundry's module browser, or
2. Use the manifest URL from the latest release
3. Enable the module in your Cosmere RPG game
4. Fortune will automatically be added to all character sheets

## Compatibility

- **Foundry VTT**: v13
- **Cosmere RPG System**: Required

## API

The module exposes its API for other modules or macros:

```javascript
const api = game.modules.get('fortune-metalmind').api;

// Get Fortune data
const fortuneData = api.FortuneManager.getFortuneData(actor);

// Set Fortune values
await api.FortuneManager.setFortuneData(actor, { current: 3, max: 5 });

// Adjust Fortune
await api.FortuneManager.adjustFortune(actor, 1); // Add 1 Fortune

// Tap Fortune (spend)
await api.FortuneManager.tapFortune(actor, cost);

// Perform Refocus meditation
await api.FortuneManager.performRefocus(actor);

// Long Rest (reset abilities)
await api.FortuneManager.longRest(actor);
```

## Credits

Fortune Metalmind homebrew mechanic created for use with the Cosmere Roleplaying Game.

## License

MIT
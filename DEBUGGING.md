# Fortune Metalmind - Debugging Guide

## Logging System

The module includes comprehensive logging to help debug and verify functionality.

### Logger Class

Located in `src/ts/logger.ts`, provides four log levels:

- `Logger.log()` - Standard info logging (always visible)
- `Logger.warn()` - Warning messages (always visible)
- `Logger.error()` - Error messages (always visible)
- `Logger.debug()` - Debug messages (only in development mode)

All logs are prefixed with `[fortune-metalmind]` for easy filtering.

### Where to Find Logs

Open the browser console (F12 in most browsers) and look for messages starting with `[fortune-metalmind]`.

### What Gets Logged

#### Module Initialization (Init Hook)
```
[fortune-metalmind] Fortune Metalmind module initializing...
[fortune-metalmind] Settings registered
[fortune-metalmind] Handlebar helpers registered
[fortune-metalmind] API exposed at game.modules.get('fortune-metalmind').api
[fortune-metalmind] Fortune Metalmind module initialized successfully
```

#### Character Sheet Rendering
```
[fortune-metalmind] renderActorSheet hook registered
[fortune-metalmind] renderActorSheet fired { actorName: "Character Name" }
[fortune-metalmind] Injecting Fortune display after header { actorName: "Character Name" }
[fortune-metalmind] Fortune display injected successfully { actorName: "Character Name" }
```

#### Fortune Manager Operations

**Get/Set Fortune Data (debug only in dev mode)**
```
[fortune-metalmind] getFortuneData { actorName: "Character Name", data: {...} }
[fortune-metalmind] setFortuneData { actorName: "Character Name", before: {...}, after: {...} }
```

**Tap Fortune**
```
[fortune-metalmind] tapFortune { actorName: "Character Name", cost: 1 }
[fortune-metalmind] tapFortune success { actorName: "Character Name", newCurrent: 4 }
```

Or if it fails:
```
[fortune-metalmind] tapFortune { actorName: "Character Name", cost: 1 }
[fortune-metalmind] tapFortune failed: tap not available { actorName: "Character Name" }
```

**Refocus**
```
[fortune-metalmind] Refocus button clicked { actorName: "Character Name" }
[fortune-metalmind] performRefocus { actorName: "Character Name" }
[fortune-metalmind] performRefocus rolled { actorName: "Character Name", result: 14 }
```

**Long Rest**
```
[fortune-metalmind] Long Rest button clicked { actorName: "Character Name" }
[fortune-metalmind] Long Rest confirmed { actorName: "Character Name" }
[fortune-metalmind] longRest { actorName: "Character Name" }
[fortune-metalmind] longRest complete { actorName: "Character Name" }
```

## Testing Checklist

### 1. Module Loads
- [ ] Check console for initialization messages
- [ ] Verify no errors in console
- [ ] Confirm API is available: `game.modules.get('fortune-metalmind').api`

### 2. Character Sheet Display
- [ ] Open a character sheet
- [ ] Check console for renderActorSheet messages
- [ ] Verify Fortune display appears on sheet
- [ ] Confirm Fortune points show "1/5" (default)
- [ ] Check "Tap Available" badge is green

### 3. Fortune Manager via Console
Test the API directly in console:
```javascript
// Get a character
const actor = game.actors.getName("Character Name");

// Get Fortune data
const api = game.modules.get('fortune-metalmind').api;
api.FortuneManager.getFortuneData(actor);

// Set Fortune
await api.FortuneManager.setFortuneData(actor, { current: 3 });

// Tap Fortune (cost 1 = advantage)
await api.FortuneManager.tapFortune(actor, 1);

// Refocus
await api.FortuneManager.performRefocus(actor);

// Long Rest
await api.FortuneManager.longRest(actor);
```

### 4. Button Interactions
- [ ] Click "Refocus" button - check console and roll message
- [ ] Click "Long Rest" button - check console and confirmation dialog
- [ ] Verify buttons trigger appropriate logs

### 5. Data Persistence
- [ ] Modify Fortune data
- [ ] Close character sheet
- [ ] Reopen character sheet
- [ ] Verify Fortune data persists

## Common Issues

### Fortune Display Not Appearing
Check console for:
- "renderActorSheet fired" message - if missing, hook isn't firing
- Any errors during template rendering
- Verify template file exists: `dist/templates/fortune-display.hbs`

### Buttons Not Working
Check console for:
- Click event messages
- Any JavaScript errors
- Verify jQuery selectors are finding the buttons

### Data Not Persisting
Check console for:
- setFortuneData messages
- Any errors from actor.setFlag()
- Verify actor has permission to be modified

### No Logs Appearing
- Ensure browser console is open (F12)
- Check console filter settings
- Search for "[fortune-metalmind]" prefix
- Verify module is enabled in Foundry

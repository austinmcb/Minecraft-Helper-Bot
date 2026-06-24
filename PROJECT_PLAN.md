# Minecraft Utility Bot Framework - Project Plan

## Current Structure Summary

The repository currently runs from a single `Aibot.js` file with bot lifecycle, movement, mining, crafting, hazard checks, and speedrun command handling all in one place.

## First Milestone Architecture

`Aibot.js` is retained as a compatibility wrapper and delegates to `src/index.js`.

### Module Organization

- `src/bot/`
  - `BotController.js`: bot lifecycle/event wiring and command dispatch
  - `BotState.js`: task/state/progress snapshot tracking for resumability
  - `BotConfig.js`: connection/task/safety defaults
- `src/navigation/`
  - `Navigator.js`: movement orchestration over pathfinder
  - `StuckDetector.js`: movement-stall detection utility
- `src/inventory/`
  - `InventoryManager.js`: inventory counting/snapshots
  - `ToolManager.js`: tool/weapon equip helpers
- `src/mining/`
  - `Digger.js`: block digging orchestration entry
  - `BlockScanner.js`: mineable block lookup
- `src/safety/`
  - `HazardDetector.js`: hazard checks around destination/face
  - `LavaHandler.js`: fail-safe lava interface (TODO behavior)
- `src/tasks/`
  - `BaseTask.js`: lifecycle contract + progress/checkpoint state
  - `StripMineTask.js`: configurable strip mine skeleton
  - `ClearBoxTask.js`: configurable clear-box skeleton
- `src/commands/`
  - `CommandParser.js`: named + positional argument parsing
  - `TaskRegistry.js`: command-to-task factory registration

## Task Abstraction Model

All actionable work is represented as tasks derived from `BaseTask`:

1. `initialize()` prepares task-local state.
2. `execute()` runs the task loop.
3. `onPause()` and `onResume()` support interruption/recovery.
4. `cleanup()` releases resources and finalizes status.

`BaseTask` also tracks `progress`, `status`, and `checkpoint` data for resumability.

## Separation of Concerns

- Bot connection/event lifecycle remains in bot controller layer.
- Command text interpretation stays in parser/registry.
- Mining patterns remain task logic.
- Safety checks are abstracted behind hazard/lava interfaces.
- Inventory/tool selection is isolated to inventory modules.

## Command Parsing Strategy

Canonical format (named parameters):

- `/strip-mine width=3 height=3 length=100`
- `/clear-box width=25 height=30 length=70`

Also supported positional shorthand:

- `/strip-mine 3 3 100`
- `/clear-box 25 30 70`

Parser design keeps room for future optional flags (direction, deposit mode, torch spacing, safety mode, allow/deny block lists).

## Lava Handling Interface (TODOs)

`LavaHandler` intentionally provides a fail-safe interface but defers full implementation:

- TODO detect source + flowing lava at mining face
- TODO place expendable blocks to contain lava
- TODO re-check face before resuming digging
- Current contract: if lava is detected and unresolved, pause/stop the task (never continue into danger)

# Refactor Milestone TODO

## Phase 1 - Core Infrastructure
- [x] Add `src/` module layout and base framework files
- [x] Add `BotController`, `BotState`, `BotConfig`
- [x] Preserve compatibility entry through `Aibot.js` wrapper

## Phase 2 - Utility Extraction
- [x] Add `Navigator` and `StuckDetector`
- [x] Add `InventoryManager` and `ToolManager`
- [x] Add `Digger`, `BlockScanner`, and `HazardDetector`

## Phase 3 - Task Abstraction
- [x] Add abstract `BaseTask` lifecycle interface
- [x] Add configurable `StripMineTask` skeleton (width/height/length)
- [x] Add configurable `ClearBoxTask` skeleton (width/height/length)
- [x] Add progress/checkpoint tracking in task/state model

## Phase 4 - Command and Registry
- [x] Add `CommandParser` for named and positional args
- [x] Add `TaskRegistry` command-to-task mapping
- [x] Register compatibility commands (`start`, `stop`, `come`) in controller registry

## Phase 5 - Docs and Validation
- [x] Add `PROJECT_PLAN.md`
- [x] Add this milestone checklist
- [ ] Add framework integration tests when test harness exists

## Future Safety Work
- [ ] Lava source + flow detection near mining face
- [ ] Lava block placement resolver (cobblestone/dirt)
- [ ] Water handling and drowning prevention
- [ ] Fall risk detection and recovery
- [ ] Hostile mob avoidance/combat retreat rules

## Performance Follow-ups
- [ ] Cache block scans by chunk/region to reduce repeated queries
- [ ] Batch inventory scans instead of repeated full inventory traversals
- [ ] Add adaptive path retry strategy with bounded backoff

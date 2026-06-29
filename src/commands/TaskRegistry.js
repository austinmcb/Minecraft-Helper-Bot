const StripMineTask = require("../tasks/StripMineTask");
const ClearBoxTask = require("../tasks/ClearBoxTask");

class TaskRegistry {
  constructor() {
    this.factories = new Map();

    this.register("strip-mine", (ctx, parsed, defaults = {}) => {
      const dimensions = ctx.commandParser.parseMiningDimensions(parsed, defaults.stripMine);
      return new StripMineTask({ ...ctx, params: dimensions });
    });

    this.register("clear-box", (ctx, parsed, defaults = {}) => {
      const dimensions = ctx.commandParser.parseMiningDimensions(parsed, defaults.clearBox);
      return new ClearBoxTask({ ...ctx, params: dimensions });
    });
  }

  register(command, factory) {
    this.factories.set(command, factory);
  }

  createTask(command, context, parsedCommand, defaults) {
    const factory = this.factories.get(command);
    if (!factory) return null;
    return factory(context, parsedCommand, defaults);
  }
}

module.exports = TaskRegistry;

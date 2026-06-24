const BaseTask = require("./BaseTask");

class StripMineTask extends BaseTask {
  constructor(context) {
    super(context);

    const { width = 3, height = 3, length = 100 } = this.params;
    this.dimensions = { width, height, length };
  }

  async initialize() {
    await super.initialize();
    this.updateProgress({
      status: "ready",
      step: "strip_mine_initialize",
      dimensions: this.dimensions,
      checkpoint: { segmentIndex: 0 },
    });
  }

  async execute() {
    this.updateProgress({
      status: "running",
      step: "strip_mine_execute",
      message: "Skeleton task: tunnel planner/executor will be implemented in later phases.",
    });
  }
}

module.exports = StripMineTask;

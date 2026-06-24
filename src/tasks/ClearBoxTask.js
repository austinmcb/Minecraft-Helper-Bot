const BaseTask = require("./BaseTask");

class ClearBoxTask extends BaseTask {
  constructor(context) {
    super(context);

    const { width = 5, height = 5, length = 5 } = this.params;
    this.dimensions = { width, height, length };
  }

  async initialize() {
    await super.initialize();
    this.updateProgress({
      status: "ready",
      step: "clear_box_initialize",
      dimensions: this.dimensions,
      checkpoint: { layer: 0, row: 0, column: 0 },
    });
  }

  async execute() {
    this.updateProgress({
      status: "running",
      step: "clear_box_execute",
      message: "Skeleton task: layer-by-layer clear behavior will be implemented in later phases.",
    });
  }
}

module.exports = ClearBoxTask;

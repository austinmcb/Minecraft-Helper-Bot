class BaseTask {
  constructor({ bot, state, params = {} }) {
    if (new.target === BaseTask) {
      throw new Error("BaseTask is abstract and cannot be instantiated directly.");
    }

    this.bot = bot;
    this.state = state;
    this.params = params;
    this.progress = {
      status: "created",
      percent: 0,
      step: "not_started",
      checkpoint: null,
      updatedAt: Date.now(),
    };
  }

  get name() {
    return this.constructor.name;
  }

  async initialize() {
    this.updateProgress({ status: "initialized", step: "initialize" });
  }

  async execute() {
    throw new Error(`${this.name}.execute() must be implemented by subclasses.`);
  }

  async onPause() {
    this.updateProgress({ status: "paused", step: "paused" });
  }

  async onResume() {
    this.updateProgress({ status: "running", step: "resumed" });
  }

  async cleanup() {
    this.updateProgress({ status: "completed", percent: 100, step: "cleanup" });
  }

  updateProgress(patch) {
    this.progress = {
      ...this.progress,
      ...patch,
      updatedAt: Date.now(),
    };

    if (this.state && typeof this.state.updateProgress === "function") {
      this.state.updateProgress(this.name, this.progress);
    }

    return this.progress;
  }

  getCheckpoint() {
    return this.progress.checkpoint;
  }

  setCheckpoint(checkpoint) {
    this.updateProgress({ checkpoint });
  }

  async pauseFromHazard(reason) {
    await this.onPause();
    this.updateProgress({ status: "paused_hazard", hazardReason: reason });
  }
}

module.exports = BaseTask;

class BotState {
  constructor() {
    this.currentTask = null;
    this.currentTaskName = null;
    this.taskStatus = "idle";
    this.isPaused = false;
    this.progress = {};
    this.lastKnownPosition = null;
    this.inventorySummary = [];
    this.startedAt = null;
  }

  setCurrentTask(taskName, taskInstance) {
    this.currentTaskName = taskName;
    this.currentTask = taskInstance;
    this.taskStatus = "running";
    this.startedAt = Date.now();
  }

  clearCurrentTask() {
    this.currentTaskName = null;
    this.currentTask = null;
    this.taskStatus = "idle";
    this.isPaused = false;
  }

  updateProgress(taskName, patch) {
    this.progress[taskName] = {
      ...(this.progress[taskName] || {}),
      ...patch,
      updatedAt: Date.now(),
    };
  }

  pauseTask() {
    this.isPaused = true;
    this.taskStatus = "paused";
  }

  resumeTask() {
    this.isPaused = false;
    this.taskStatus = this.currentTask ? "running" : "idle";
  }

  toSnapshot() {
    return {
      currentTaskName: this.currentTaskName,
      taskStatus: this.taskStatus,
      isPaused: this.isPaused,
      progress: this.progress,
      lastKnownPosition: this.lastKnownPosition,
      inventorySummary: this.inventorySummary,
      startedAt: this.startedAt,
    };
  }

  loadSnapshot(snapshot = {}) {
    this.currentTaskName = snapshot.currentTaskName || null;
    this.taskStatus = snapshot.taskStatus || "idle";
    this.isPaused = Boolean(snapshot.isPaused);
    this.progress = snapshot.progress || {};
    this.lastKnownPosition = snapshot.lastKnownPosition || null;
    this.inventorySummary = snapshot.inventorySummary || [];
    this.startedAt = snapshot.startedAt || null;
  }
}

module.exports = BotState;

const mineflayer = require("mineflayer");
const { pathfinder } = require("mineflayer-pathfinder");
const BotConfig = require("./BotConfig");
const BotState = require("./BotState");
const CommandParser = require("../commands/CommandParser");
const TaskRegistry = require("../commands/TaskRegistry");
const HazardDetector = require("../safety/HazardDetector");
const LavaHandler = require("../safety/LavaHandler");

class BotController {
  constructor(config = BotConfig, compatibilityLayer = {}, runtimeAdapters = {}) {
    this.config = config;
    this.state = new BotState();
    this.commandParser = new CommandParser();
    this.taskRegistry = new TaskRegistry();
    this.compatibilityLayer = compatibilityLayer;
    this.runtimeAdapters = {
      createBot:
        runtimeAdapters.createBot ||
        ((options) => {
          return mineflayer.createBot(options);
        }),
      loadPathfinder:
        runtimeAdapters.loadPathfinder ||
        ((bot) => {
          bot.loadPlugin(pathfinder);
        }),
    };
    this.bot = null;
    this.hazardDetector = null;
    this.lavaHandler = null;
    this.currentTaskPromise = null;
    this.cleanedTasks = new WeakSet();

    this.taskRegistry.register("start", () => this.compatibilityLayer.startTask?.());
    this.taskRegistry.register("come", () => this.compatibilityLayer.comeTask?.());
  }

  start() {
    const { username, host, port } = this.config.connection;

    this.bot = this.runtimeAdapters.createBot({ username, host, port });
    this.runtimeAdapters.loadPathfinder(this.bot);
    this.hazardDetector = new HazardDetector(this.bot, this.config.safety);
    this.lavaHandler = new LavaHandler(this.bot);

    if (typeof this.compatibilityLayer.bind === "function") {
      this.compatibilityLayer.bind({ bot: this.bot, config: this.config, state: this.state });
    }

    this.bot.once("spawn", () => this.onSpawn());
    this.bot.on("chat", (usernameArg, message) => this.onChat(usernameArg, message));
    this.bot.on("end", () => this.onEnd());
    this.bot.on("kicked", (reason) => console.log("Bot was kicked:", reason));
    this.bot.on("error", (err) => console.log("Bot encountered an error:", err));

    return this.bot;
  }

  onSpawn() {
    this.bot.chat("Bot ready.");
    if (typeof this.compatibilityLayer.onSpawn === "function") {
      this.compatibilityLayer.onSpawn();
    }
  }

  async onChat(username, message) {
    if (username === this.bot.username) return;

    try {
      const parsed = this.commandParser.parse(message);
      if (!parsed) return;

      if (parsed.command === "stop") {
        await this.stopCurrentTask("Stop command received.", { invokeLegacyStop: true });
        return;
      }

      const created = this.taskRegistry.createTask(
        parsed.command,
        { bot: this.bot, state: this.state, commandParser: this.commandParser },
        parsed,
        this.config.tasks
      );

      if (!created) {
        this.bot.chat("Unknown command.");
        return;
      }

      await this.startTask(created, parsed.command);
    } catch (error) {
      this.bot?.chat(`Command error: ${error.message}`);
    }
  }

  async startTask(taskLike, fallbackName = "task") {
    if (this.isBusy()) {
      this.bot?.chat("Task rejected: bot is already busy with another task.");
      return false;
    }

    const task = this.#normalizeTask(taskLike, fallbackName);
    this.state.setCurrentTask(task.name, task);

    this.currentTaskPromise = (async () => {
      try {
        if (typeof task.initialize === "function") {
          await task.initialize();
        }

        const isSafe = await this.#enforceTaskSafety(task);
        if (!isSafe) return false;

        if (typeof task.execute === "function") {
          await task.execute();
        }

        await this.#cleanupTaskOnce(task);

        return true;
      } catch (error) {
        this.bot?.chat(`Task failed: ${error.message}`);
        return false;
      } finally {
        if (this.state.currentTask === task) {
          this.state.clearCurrentTask();
        }
        this.currentTaskPromise = null;
      }
    })();

    return this.currentTaskPromise;
  }

  async stopCurrentTask(reason = "Stopped by request.", options = {}) {
    const { invokeLegacyStop = false, announce = true } = options;
    const task = this.getCurrentTask();

    if (task) {
      try {
        if (typeof task.cancel === "function") {
          await task.cancel(reason);
        } else if (typeof task.pauseFromHazard === "function") {
          await task.pauseFromHazard(reason);
        }

        await this.#cleanupTaskOnce(task);
      } finally {
        this.state.clearCurrentTask();
        this.currentTaskPromise = null;
      }
    }

    if (announce) {
      this.bot?.chat(task ? `Task stopped: ${reason}` : `No active task to stop.`);
    }

    if (invokeLegacyStop && typeof this.compatibilityLayer.stopTask === "function") {
      await this.compatibilityLayer.stopTask(reason);
    }

    return Boolean(task);
  }

  getCurrentTask() {
    return this.state.currentTask;
  }

  isBusy() {
    return Boolean(this.state.currentTask || this.currentTaskPromise);
  }

  onEnd() {
    console.log("Bot disconnected.");
  }

  async #enforceTaskSafety(task) {
    if (!this.bot) return true;

    if (this.hazardDetector?.isHazardous(this.bot.entity?.position)) {
      this.bot.chat("Fail-safe: hazardous position detected. Stopping task.");
      await this.stopCurrentTask("Fail-safe hazard stop.", { announce: false });
      return false;
    }

    if (this.config.safety?.failSafeOnLava !== false && this.lavaHandler) {
      const lavaStatus = await this.lavaHandler.enforceFailSafeOnUnresolvedLava(task);
      if (!lavaStatus.safe) {
        this.bot.chat(lavaStatus.message || "Fail-safe: unresolved lava hazard.");
        await this.stopCurrentTask("Fail-safe unresolved lava.", { announce: false });
        return false;
      }
    }

    return true;
  }

  #normalizeTask(taskLike, fallbackName) {
    if (taskLike && typeof taskLike === "object") return taskLike;

    return {
      name: `${fallbackName}-compat`,
      async initialize() {},
      async execute() {
        if (typeof taskLike === "function") {
          await taskLike();
        }
      },
      async cleanup() {},
      async cancel() {},
    };
  }

  async #cleanupTaskOnce(task) {
    if (!task || typeof task !== "object") return;
    if (this.cleanedTasks.has(task)) return;
    this.cleanedTasks.add(task);
    if (typeof task.cleanup === "function") {
      await task.cleanup();
    }
  }
}

module.exports = BotController;

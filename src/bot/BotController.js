const mineflayer = require("mineflayer");
const { pathfinder } = require("mineflayer-pathfinder");
const BotConfig = require("./BotConfig");
const BotState = require("./BotState");
const CommandParser = require("../commands/CommandParser");
const TaskRegistry = require("../commands/TaskRegistry");

class BotController {
  constructor(config = BotConfig, compatibilityLayer = {}) {
    this.config = config;
    this.state = new BotState();
    this.commandParser = new CommandParser();
    this.taskRegistry = new TaskRegistry();
    this.compatibilityLayer = compatibilityLayer;
    this.bot = null;

    this.taskRegistry.register("start", () => this.compatibilityLayer.startTask?.());
    this.taskRegistry.register("come", () => this.compatibilityLayer.comeTask?.());
    this.taskRegistry.register("stop", () => this.compatibilityLayer.stopTask?.());
  }

  start() {
    const { username, host, port } = this.config.connection;

    this.bot = mineflayer.createBot({ username, host, port });
    this.bot.loadPlugin(pathfinder);
    this.bot.once("spawn", () => this.onSpawn());
    this.bot.on("chat", (usernameArg, message) => this.onChat(usernameArg, message));
    this.bot.on("end", () => this.onEnd());
    this.bot.on("kicked", (reason) => console.log("Bot was kicked:", reason));
    this.bot.on("error", (err) => console.log("Bot encountered an error:", err));

    return this.bot;
  }

  onSpawn() {
    this.bot.chat("Bot ready.");
  }

  async onChat(username, message) {
    if (username === this.bot.username) return;

    const parsed = this.commandParser.parse(message);
    if (!parsed) return;

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

    if (typeof created === "function") {
      await created();
      return;
    }

    await created.initialize();
    this.state.setCurrentTask(created.name, created);
    await created.execute();
  }

  onEnd() {
    console.log("Bot disconnected.");
  }
}

module.exports = BotController;

const BotConfig = {
  connection: {
    username: "SpeedRunnerBot",
    host: "localhost",
    port: 25565,
  },
  playerUsername: "ZladZootin",
  safety: {
    avoidBlocks: ["lava", "fire", "cactus"],
    failSafeOnLava: true,
  },
  tasks: {
    stripMine: { width: 3, height: 3, length: 100 },
    clearBox: { width: 5, height: 5, length: 5 },
  },
};

module.exports = BotConfig;

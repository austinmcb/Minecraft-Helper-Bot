const LegacyAibot = require("./LegacyAibot");

function createLegacyCompat() {
  return {
    bind({ bot, config }) {
      LegacyAibot.attachBot(bot, { playerUsername: config?.playerUsername });
    },
    async startTask() {
      return LegacyAibot.startTask();
    },
    async comeTask() {
      return LegacyAibot.comeTask();
    },
    async stopTask(reason) {
      return LegacyAibot.stopTask(reason);
    },
  };
}

function startLegacyBot() {
  return LegacyAibot.startLegacyRuntime();
}

module.exports = {
  createLegacyCompat,
  startLegacyBot,
};

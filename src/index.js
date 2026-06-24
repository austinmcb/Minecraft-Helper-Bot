const BotController = require("./bot/BotController");
const BotConfig = require("./bot/BotConfig");
const { createLegacyCompat, startLegacyBot } = require("./legacy/LegacyCompat");

function start() {
  try {
    const controller = new BotController(BotConfig, createLegacyCompat());
    controller.start();
    return controller;
  } catch (error) {
    console.log("Framework runtime failed. Falling back to legacy runtime.", error);
    return startLegacyBot();
  }
}

module.exports = {
  start,
};

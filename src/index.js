const { startLegacyBot } = require("./legacy/LegacyCompat");

function start() {
  return startLegacyBot();
}

module.exports = {
  start,
};

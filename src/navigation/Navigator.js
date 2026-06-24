const { goals, Movements } = require("mineflayer-pathfinder");
const StuckDetector = require("./StuckDetector");

class Navigator {
  constructor(bot, hazardDetector) {
    this.bot = bot;
    this.hazardDetector = hazardDetector;
    this.stuckDetector = new StuckDetector();
  }

  async moveTo(position, options = {}) {
    const movements = new Movements(this.bot, this.bot.pathfinder);
    movements.allowSprinting = true;
    movements.canDig = true;
    this.bot.pathfinder.setMovements(movements);

    const safePosition = this.hazardDetector
      ? this.hazardDetector.getSafeDestination(position)
      : position;

    await this.bot.pathfinder.goto(
      new goals.GoalBlock(safePosition.x, safePosition.y, safePosition.z)
    );

    return safePosition;
  }

  async moveNear(position, range = 1) {
    await this.bot.pathfinder.goto(
      new goals.GoalNear(position.x, position.y, position.z, range)
    );
  }
}

module.exports = Navigator;

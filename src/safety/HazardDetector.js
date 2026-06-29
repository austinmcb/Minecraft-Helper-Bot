class HazardDetector {
  constructor(bot, config = {}) {
    this.bot = bot;
    this.avoidBlocks = config.avoidBlocks || ["lava", "fire", "cactus"];
  }

  isHazardous(position) {
    if (!position) return false;

    const below = this.bot.blockAt(position.offset(0, -1, 0));
    const atFeet = this.bot.blockAt(position);
    const atHead = this.bot.blockAt(position.offset(0, 1, 0));

    return [below, atFeet, atHead].some(
      (block) => block && this.avoidBlocks.includes(block.name)
    );
  }

  getSafeDestination(position) {
    if (!this.isHazardous(position)) return position;
    return position.offset(1, 0, 1);
  }
}

module.exports = HazardDetector;

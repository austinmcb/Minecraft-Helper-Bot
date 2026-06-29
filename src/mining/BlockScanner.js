class BlockScanner {
  constructor(bot) {
    this.bot = bot;
  }

  findNearestByNames(names, maxDistance = 64) {
    return this.bot.findBlock({
      matching: (block) => names.includes(block.name),
      maxDistance,
    });
  }
}

module.exports = BlockScanner;

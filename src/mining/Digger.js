class Digger {
  constructor(bot, toolManager, hazardDetector) {
    this.bot = bot;
    this.toolManager = toolManager;
    this.hazardDetector = hazardDetector;
  }

  async digBlock(block, { toolKeyword } = {}) {
    if (!block) return false;

    if (this.hazardDetector && this.hazardDetector.isHazardous(block.position)) {
      return false;
    }

    if (toolKeyword && this.toolManager) {
      await this.toolManager.equipByKeyword(toolKeyword);
    }

    await this.bot.dig(block);
    return true;
  }
}

module.exports = Digger;

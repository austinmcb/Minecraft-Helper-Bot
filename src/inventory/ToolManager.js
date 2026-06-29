class ToolManager {
  constructor(bot) {
    this.bot = bot;
  }

  async equipByKeyword(keyword, destination = "hand") {
    const tool = this.bot.inventory.items().find((item) => item.name.includes(keyword));
    if (!tool) return false;
    await this.bot.equip(tool, destination);
    return true;
  }

  async equipBestWeapon(preferred = "sword") {
    return this.equipByKeyword(preferred, "hand");
  }
}

module.exports = ToolManager;

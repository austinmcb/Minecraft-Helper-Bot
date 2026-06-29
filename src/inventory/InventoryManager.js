class InventoryManager {
  constructor(bot) {
    this.bot = bot;
  }

  countInInventory(itemName) {
    return this.bot
      .inventory
      .items()
      .filter((item) => item.name.includes(itemName))
      .reduce((sum, item) => sum + item.count, 0);
  }

  hasSpace() {
    return this.bot.inventory.emptySlotCount() > 0;
  }

  hasItem(itemName, count = 1) {
    return this.countInInventory(itemName) >= count;
  }

  snapshot() {
    return this.bot.inventory.items().map((item) => ({
      name: item.name,
      count: item.count,
      slot: item.slot,
    }));
  }
}

module.exports = InventoryManager;

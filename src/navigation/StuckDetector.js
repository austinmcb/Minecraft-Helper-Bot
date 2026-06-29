class StuckDetector {
  constructor(maxTicksWithoutMovement = 40) {
    this.maxTicksWithoutMovement = maxTicksWithoutMovement;
    this.lastPosition = null;
    this.stillTicks = 0;
  }

  update(position) {
    if (!this.lastPosition) {
      this.lastPosition = position;
      return false;
    }

    const moved =
      this.lastPosition.x !== position.x ||
      this.lastPosition.y !== position.y ||
      this.lastPosition.z !== position.z;

    this.stillTicks = moved ? 0 : this.stillTicks + 1;
    this.lastPosition = position;

    return this.stillTicks >= this.maxTicksWithoutMovement;
  }

  reset() {
    this.lastPosition = null;
    this.stillTicks = 0;
  }
}

module.exports = StuckDetector;

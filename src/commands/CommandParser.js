class CommandParser {
  parse(rawMessage = "") {
    const message = rawMessage.trim();
    if (!message) return null;

    const normalized = message.startsWith("/") ? message.slice(1) : message;
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (!tokens.length) return null;

    const command = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    const namedParams = {};
    const positional = [];

    for (const arg of args) {
      if (arg.includes("=")) {
        const [key, ...valueParts] = arg.split("=");
        const value = valueParts.join("=");
        namedParams[key] = this.#coerceValue(value);
      } else {
        positional.push(this.#coerceValue(arg));
      }
    }

    return {
      raw: rawMessage,
      command,
      namedParams,
      positional,
    };
  }

  parseMiningDimensions(parsedCommand, defaults = {}) {
    const positional = parsedCommand?.positional || [];
    const named = parsedCommand?.namedParams || {};

    const width = Number(named.width ?? positional[0] ?? defaults.width ?? 3);
    const height = Number(named.height ?? positional[1] ?? defaults.height ?? 3);
    const length = Number(named.length ?? positional[2] ?? defaults.length ?? 100);

    this.#assertPositiveDimension(width, "width");
    this.#assertPositiveDimension(height, "height");
    this.#assertPositiveDimension(length, "length");

    return {
      width,
      height,
      length,
    };
  }

  #coerceValue(value) {
    if (/^-?\d+$/.test(value)) return Number(value);
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }

  #assertPositiveDimension(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Invalid ${name}: expected a positive number.`);
    }
  }
}

module.exports = CommandParser;

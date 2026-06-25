const assert = require("assert");
const BotController = require("../../src/bot/BotController");
const CommandParser = require("../../src/commands/CommandParser");
const TaskRegistry = require("../../src/commands/TaskRegistry");

function createControllerForTests() {
  const messages = [];
  const compatibilityLayer = {
    stopCalls: 0,
    startCalls: 0,
    comeCalls: 0,
    async startTask() {
      compatibilityLayer.startCalls += 1;
      return true;
    },
    async comeTask() {
      compatibilityLayer.comeCalls += 1;
      return true;
    },
    async stopTask() {
      compatibilityLayer.stopCalls += 1;
      return true;
    },
  };

  const controller = new BotController(
    {
      connection: { username: "TestBot", host: "localhost", port: 25565 },
      safety: { failSafeOnLava: true },
      tasks: {
        stripMine: { width: 3, height: 3, length: 100 },
        clearBox: { width: 5, height: 5, length: 5 },
      },
    },
    compatibilityLayer
  );

  controller.bot = {
    username: "TestBot",
    entity: { position: { x: 0, y: 64, z: 0 } },
    chat(message) {
      messages.push(message);
    },
    quit() {},
  };
  controller.hazardDetector = { isHazardous: () => false };
  controller.lavaHandler = {
    async enforceFailSafeOnUnresolvedLava() {
      return { safe: true };
    },
  };

  return { controller, messages, compatibilityLayer };
}

function createBlockingTask(name = "BlockingTask") {
  let release;
  let canceled = false;
  let cleanupCalls = 0;
  const waitPromise = new Promise((resolve) => {
    release = resolve;
  });

  return {
    name,
    async initialize() {},
    async execute() {
      await waitPromise;
    },
    async cleanup() {
      cleanupCalls += 1;
    },
    async cancel() {
      canceled = true;
      release();
    },
    get canceled() {
      return canceled;
    },
    get cleanupCalls() {
      return cleanupCalls;
    },
  };
}

async function testCommandParser() {
  const parser = new CommandParser();
  const named = parser.parse("/strip-mine width=3 height=3 length=100");
  const positional = parser.parse("/strip-mine 3 3 100");
  const clearNamed = parser.parse("/clear-box width=25 height=30 length=70");

  assert.strictEqual(named.command, "strip-mine");
  assert.deepStrictEqual(named.namedParams, { width: 3, height: 3, length: 100 });
  assert.deepStrictEqual(positional.positional, [3, 3, 100]);
  assert.deepStrictEqual(clearNamed.namedParams, { width: 25, height: 30, length: 70 });
  assert.throws(
    () => parser.parseMiningDimensions(parser.parse("/strip-mine width=abc"), {}),
    /Invalid width/
  );
}

async function testTaskRegistry() {
  const parser = new CommandParser();
  const registry = new TaskRegistry();
  const context = { bot: {}, state: {}, commandParser: parser };

  const stripTask = registry.createTask(
    "strip-mine",
    context,
    parser.parse("/strip-mine width=3 height=3 length=100"),
    { stripMine: { width: 1, height: 1, length: 1 } }
  );

  const clearTask = registry.createTask(
    "clear-box",
    context,
    parser.parse("/clear-box width=25 height=30 length=70"),
    { clearBox: { width: 1, height: 1, length: 1 } }
  );

  assert.deepStrictEqual(stripTask.dimensions, { width: 3, height: 3, length: 100 });
  assert.deepStrictEqual(clearTask.dimensions, { width: 25, height: 30, length: 70 });
}

async function testTaskLifecycle() {
  const { controller } = createControllerForTests();
  const task = createBlockingTask("LifecycleTask");

  const running = controller.startTask(task, "lifecycle");
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.strictEqual(controller.isBusy(), true);
  assert.strictEqual(controller.getCurrentTask(), task);

  await controller.stopCurrentTask("Lifecycle test stop");
  await running;

  assert.strictEqual(task.canceled, true);
  assert.strictEqual(task.cleanupCalls, 1);
  assert.strictEqual(controller.getCurrentTask(), null);
  assert.strictEqual(controller.isBusy(), false);
}

async function testBusyTaskRejection() {
  const { controller, messages } = createControllerForTests();
  const first = createBlockingTask("FirstTask");
  const second = createBlockingTask("SecondTask");

  const running = controller.startTask(first, "first");
  await new Promise((resolve) => setTimeout(resolve, 0));

  const accepted = await controller.startTask(second, "second");
  assert.strictEqual(accepted, false);
  assert.ok(messages.some((message) => message.includes("Task rejected")));

  await controller.stopCurrentTask("Busy test cleanup");
  await running;
}

async function testStopCancelBehavior() {
  const { controller, compatibilityLayer } = createControllerForTests();
  const task = createBlockingTask("HoldTask");

  controller.taskRegistry.register("hold", () => task);

  const running = controller.onChat("player", "/hold");
  await new Promise((resolve) => setTimeout(resolve, 0));
  await controller.onChat("player", "/stop");
  await running;

  assert.strictEqual(task.canceled, true);
  assert.strictEqual(task.cleanupCalls, 1);
  assert.strictEqual(compatibilityLayer.stopCalls, 1);
}

async function testLegacyCommandRouting() {
  const { controller, compatibilityLayer } = createControllerForTests();
  await controller.onChat("player", "/start");
  await controller.onChat("player", "/come");
  assert.strictEqual(compatibilityLayer.startCalls, 1);
  assert.strictEqual(compatibilityLayer.comeCalls, 1);
}

async function testMalformedCommandHandling() {
  const { controller, messages } = createControllerForTests();
  await controller.onChat("player", "/strip-mine width=abc height=3 length=100");
  assert.ok(messages.some((message) => message.includes("Command error: Invalid width")));
}

async function run() {
  await testCommandParser();
  await testTaskRegistry();
  await testTaskLifecycle();
  await testBusyTaskRejection();
  await testStopCancelBehavior();
  await testLegacyCommandRouting();
  await testMalformedCommandHandling();
  console.log("Smoke tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

const assert = require("assert");
const BotController = require("../../src/bot/BotController");
const CommandParser = require("../../src/commands/CommandParser");
const TaskRegistry = require("../../src/commands/TaskRegistry");

function createControllerForTests() {
  const messages = [];
  const compatibilityLayer = {
    stopCalls: 0,
    async startTask() {
      return true;
    },
    async comeTask() {
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
  const waitPromise = new Promise((resolve) => {
    release = resolve;
  });

  return {
    name,
    async initialize() {},
    async execute() {
      await waitPromise;
    },
    async cleanup() {},
    async cancel() {
      canceled = true;
      release();
    },
    get canceled() {
      return canceled;
    },
  };
}

async function testCommandParser() {
  const parser = new CommandParser();
  const named = parser.parse("/strip-mine width=3 height=3 length=100");
  const positional = parser.parse("/strip-mine 3 3 100");

  assert.strictEqual(named.command, "strip-mine");
  assert.deepStrictEqual(named.namedParams, { width: 3, height: 3, length: 100 });
  assert.deepStrictEqual(positional.positional, [3, 3, 100]);
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
    parser.parse("/clear-box 25 30 70"),
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
  assert.strictEqual(compatibilityLayer.stopCalls, 1);
}

async function run() {
  await testCommandParser();
  await testTaskRegistry();
  await testTaskLifecycle();
  await testBusyTaskRejection();
  await testStopCancelBehavior();
  console.log("Smoke tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

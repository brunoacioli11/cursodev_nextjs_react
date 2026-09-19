const { spawn, spawnSync } = require("node:child_process");

const isWindows = process.platform === "win32";

const signals = isWindows
  ? ["SIGINT", "SIGBREAK"]
  : ["SIGINT", "SIGTERM", "SIGHUP"];

let child = null;
let alreadyStopped = false;

function stopServices() {
  if (alreadyStopped) return;
  alreadyStopped = true;
  spawnSync("npm run services:stop", { stdio: "inherit", shell: true });
}

function finish(code, signal) {
  stopServices();

  if (signal && !isWindows) {
    signals.forEach((registered) => process.removeAllListeners(registered));
    process.kill(process.pid, signal);
    return;
  }

  process.exit(signal ? 1 : code);
}

process.on("exit", stopServices);

signals.forEach((signal) =>
  process.on(signal, () => {
    if (child) child.kill(signal);
    finish(null, signal);
  }),
);

const services = spawnSync("npm run services:up", {
  stdio: "inherit",
  shell: true,
});

if (services.status !== 0) {
  process.exit(services.status ?? 1);
}

child = spawn(
  'concurrently --names next,jest --hide next --kill-others --success command-jest "next dev" "jest --runInBand --verbose"',
  { stdio: "inherit", shell: true },
);

child.on("exit", (code, signal) => finish(code ?? 1, signal));

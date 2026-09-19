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

const steps = [
  "npm run services:up",
  "npm run services:wait:database",
  "npm run migrations:up",
];

for (const step of steps) {
  const result = spawnSync(step, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1); // the "exit" handler stops the containers
  }
}

child = spawn("next dev", { stdio: "inherit", shell: true });
child.on("exit", (code, signal) => finish(code ?? 1, signal));

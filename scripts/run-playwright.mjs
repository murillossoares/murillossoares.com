import net from "node:net";
import { spawn } from "node:child_process";

const host = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const requestedPort = parsePort(process.env.PLAYWRIGHT_PORT);
const defaultPort = 3100;
const args = process.argv.slice(2);

function parsePort(value) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function probePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.once("error", () => resolve(null));
    server.listen(port, host, () => {
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : null;
      server.close(() => resolve(resolvedPort));
    });
  });
}

async function resolvePort() {
  if (requestedPort) {
    return requestedPort;
  }

  return (await probePort(defaultPort)) ?? (await probePort(0)) ?? defaultPort;
}

const port = await resolvePort();
const env = {
  ...process.env,
  PLAYWRIGHT_HOST: host,
  PLAYWRIGHT_PORT: String(port),
  PLAYWRIGHT_BASE_URL: `http://${host}:${port}`,
};

delete env.NO_COLOR;

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const child = spawn(npmCommand, ["exec", "playwright", "test", ...args], {
  stdio: "inherit",
  env,
});

child.on("error", (error) => {
  console.error(`Failed to launch Playwright: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

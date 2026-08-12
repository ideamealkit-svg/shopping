import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const port = 4173;
const host = "127.0.0.1";
const routes = ["/", "/products", "/admin", "/mypage", "/products/aura-h1", "/products/noir-x", "/products/tide-s", "/products/echo-pro"];

const server = spawn(process.execPath, [join(root, "node_modules", "vinext", "dist", "cli.js"), "start", "--port", String(port), "--hostname", host], {
  cwd: root,
  env: process.env,
  stdio: "pipe",
});

const stop = () => {
  if (!server.killed) server.kill();
};

process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(1); });
process.on("SIGTERM", () => { stop(); process.exit(1); });

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://${host}:${port}${basePath || "/"}`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 300));
  }
  throw new Error("Timed out waiting for the local production renderer.");
}

function outputFileFor(route) {
  if (route === "/") return join(output, "index.html");
  return join(output, route.replace(/^\//, ""), "index.html");
}

try {
  await waitForServer();
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(join(root, "dist", "client"), output, { recursive: true });

  for (const route of routes) {
    const response = await fetch(`http://${host}:${port}${basePath}${route}`);
    if (!response.ok) throw new Error(`Failed to export ${route}: HTTP ${response.status}`);
    const file = outputFileFor(route);
    await mkdir(resolve(file, ".."), { recursive: true });
    await writeFile(file, await response.text(), "utf8");
  }

  // Prevent GitHub Pages from running Jekyll (which ignores _next / _assets)
  await writeFile(join(output, ".nojekyll"), "", "utf8");

  // Create 404.html SPA fallback for direct subpath navigations
  await cp(join(output, "index.html"), join(output, "404.html"));

  console.log(`Exported ${routes.length} GitHub Pages routes, .nojekyll, and 404.html to out/`);
} finally {
  stop();
}

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = resolve("test_results/tg-criativo");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const projectId = "01M0S1V8N1A9ZPP5F0NK8PSWSD";
const routes = [
  { file: "final-simple.png", url: "http://localhost:5173/" },
  { file: "final-central.png", url: "http://localhost:5173/criativo/" },
  { file: "final-briefing.png", url: `http://localhost:5173/criativo/projects/${projectId}/assistant` },
  { file: "final-elementos.png", url: `http://localhost:5173/criativo/projects/${projectId}/characters` },
  { file: "final-styles.png", url: `http://localhost:5173/criativo/projects/${projectId}/styles` },
  { file: "final-workbench.png", url: `http://localhost:5173/criativo/projects/${projectId}/episodes/1/beats` },
  { file: "final-canvas.png", url: `http://localhost:5173/criativo/projects/${projectId}/freezone` },
];

async function main() {
  const port = 9224;
  const proc = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${port}`,
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      pageTarget = list.find((t) => t.type === "page");
      if (pageTarget?.webSocketDebuggerUrl) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (!pageTarget?.webSocketDebuggerUrl) {
    console.error("Failed to find page target in Chrome CDP");
    proc.kill();
    process.exit(1);
  }

  console.log("Connected to page CDP. Capturing pristine routes...");

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      if (data.error) callbacks.get(data.id)({ error: data.error });
      else callbacks.get(data.id)({ result: data.result });
      callbacks.delete(data.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, (res) => {
        if (res?.error) reject(new Error(res.error.message || JSON.stringify(res.error)));
        else resolve(res?.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");

  // First, navigate to /criativo/ to set localStorage flags
  await send("Page.navigate", { url: "http://localhost:5173/criativo/" });
  await new Promise((r) => setTimeout(r, 2000));
  await send("Runtime.evaluate", {
    expression: `
      localStorage.setItem("dramaclaw:release-notifications:muted", "true");
      localStorage.setItem("supertale-app", JSON.stringify({ state: { theme: "light" } }));
      localStorage.setItem("dramaclaw:last_seen_release_tag", "v1.1.0");
    `,
  });

  for (const route of routes) {
    console.log(`- Navigating to ${route.url}`);
    await send("Page.navigate", { url: route.url });
    // Allow React tree and queries to hydrate
    await new Promise((r) => setTimeout(r, 2500));
    
    // Dismiss any dialog if present
    await send("Runtime.evaluate", {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Entendi'));
        if (btn) btn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    const snap = await send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(snap.data, "base64");
    const targetFile = resolve(outDir, route.file);
    writeFileSync(targetFile, buffer);
    console.log(`  ✓ Saved ${route.file} (${buffer.length} bytes)`);
  }

  ws.close();
  proc.kill();
  console.log("All pristine screenshots captured successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

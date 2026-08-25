import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = resolve("test_results/tg-criativo");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const projectId = "01M0S1V8N1A9ZPP5F0NK8PSWSD";
const targets = [
  { name: "final-simple.png", url: "http://localhost:5173/" },
  { name: "final-central.png", url: "http://localhost:5173/criativo/" },
  { name: "final-briefing.png", url: `http://localhost:5173/criativo/projects/${projectId}/assistant` },
  { name: "final-elementos.png", url: `http://localhost:5173/criativo/projects/${projectId}/characters` },
  { name: "final-styles.png", url: `http://localhost:5173/criativo/projects/${projectId}/styles` },
  { name: "final-workbench.png", url: `http://localhost:5173/criativo/projects/${projectId}/episodes/1/beats` },
  { name: "final-canvas.png", url: `http://localhost:5173/criativo/projects/${projectId}/freezone` },
];

console.log("Capturing screenshots for all key routes...");
for (const target of targets) {
  const dest = resolve(outDir, target.name);
  const cmd = `"${chrome}" --headless --disable-gpu --virtual-time-budget=8000 --window-size=1440,900 --screenshot="${dest}" "${target.url}"`;
  console.log(`- ${target.name} (${target.url})`);
  execSync(cmd, { stdio: "ignore" });
}
console.log("All screenshots captured successfully!");

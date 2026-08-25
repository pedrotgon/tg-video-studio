#!/usr/bin/env node
/** Update only visual query/assertion literals in UI tests. */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = "engines/dramaclaw/frontend";
const require = createRequire(resolve(root, frontend, "package.json"));
const ts = require("typescript");
const CJK = /[\u3400-\u9fff]/g;
const TARGET_CALL = /(get|find|query)(All)?By|toContain|toBe|toEqual|toMatch|includes|toHave(Attribute|TextContent|AccessibleName)/;
const TESTS = [
  "routes/beats-sketch-render-contract.test.ts",
  "routes/ingest-settings-save.test.tsx",
  "components/episode/beat-workbench/render-section.test.tsx",
  "components/episode/beat-workbench/action-panel.test.tsx",
  "components/episode/beat-workbench/sketch-section.test.tsx",
  "components/episode/beat-workbench/audio-pane.test.tsx",
  "components/episode/beat-workbench/text-pane.test.tsx",
  "components/assets/asset-panels-rename.test.tsx",
  "components/assets/prop-asset-card.test.tsx",
  "components/assets/character-stats-strip.test.tsx",
  "components/assets/scene-environment-prompt.test.ts",
  "features/freezone/asset-library-browser-item-actions.test.tsx",
  "features/freezone/asset-library-panel-beat-context.test.tsx",
  "features/freezone/node-context-badges.test.tsx",
  "features/freezone/commit-dialog-targets.test.ts",
  "features/canvas/asset-library-modal-categories.test.tsx",
  "features/canvas/beat-context-node.test.tsx",
  "features/canvas/style-gallery-modal.test.tsx",
  "features/canvas/style-node.test.tsx",
  "features/canvas/canvas-add-node-panel.test.tsx",
  "features/canvas/image-gen-director-world-entry.test.ts",
  "features/viewer-kit/pano/PanoCaptureSurface.controls.test.tsx",
  "features/viewer-kit/pano/PanoCaptureDialog.test.tsx",
];

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function sourceFile(source, path) {
  return ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function strings(file) {
  const result = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) result.push(node);
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}

const mappings = new Map();
const conflicts = new Set();
for (const path of git("diff", "--name-only", "--", `${frontend}/src`).trim().split("\n")) {
  if (!path.endsWith(".tsx") || path.includes("/__tests__/")) continue;
  const before = strings(sourceFile(git("show", `HEAD:${path}`), path));
  const after = strings(sourceFile(readFileSync(resolve(root, path), "utf8"), path));
  if (before.length !== after.length) continue;
  for (let index = 0; index < before.length; index += 1) {
    const oldText = before[index].text;
    const newText = after[index].text;
    if ((oldText.match(CJK)?.length ?? 0) < 2 || CJK.test(newText) || oldText === newText) continue;
    CJK.lastIndex = 0;
    if (mappings.has(oldText) && mappings.get(oldText) !== newText) conflicts.add(oldText);
    else mappings.set(oldText, newText);
  }
}
for (const value of conflicts) mappings.delete(value);
const replacements = [...mappings].sort((left, right) => right[0].length - left[0].length);

function isVisualExpectation(node) {
  let current = node.parent;
  for (let depth = 0; current && depth < 8; depth += 1, current = current.parent) {
    if (ts.isCallExpression(current) && TARGET_CALL.test(current.expression.getText())) return true;
  }
  return false;
}

for (const item of TESTS) {
  const path = `${frontend}/src/__tests__/${item}`;
  const original = git("show", `HEAD:${path}`);
  let updated = original;
  const file = sourceFile(original, path);
  const edits = [];
  function visit(node) {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && isVisualExpectation(node)) {
      let value = node.text;
      for (const [oldText, newText] of replacements) value = value.replaceAll(oldText, newText);
      if (value !== node.text) {
        const start = node.getStart(file);
        const quote = original[start];
        const escaped = value.replaceAll(quote, `\\${quote}`).replaceAll("\n", "\\n");
        edits.push({ start: start + 1, end: node.getEnd() - 1, text: escaped });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    updated = updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
  }
  writeFileSync(resolve(root, path), updated);
}

console.log(`${replacements.length} mapeamentos aplicados a ${TESTS.length} testes visuais.`);

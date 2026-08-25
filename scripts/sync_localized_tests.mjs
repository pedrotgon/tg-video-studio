#!/usr/bin/env node
/** Restore frontend tests from HEAD and sync exact UI literals with localized sources. */

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = "engines/dramaclaw/frontend";
const require = createRequire(resolve(root, frontend, "package.json"));
const ts = require("typescript");
const CJK = /[\u3400-\u9fff]/;

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function literals(source, filename) {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      result.push({ start: node.getStart(file), end: node.getEnd(), text: node.text });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}

const changed = git("diff", "--name-only", "--", `${frontend}/src`)
  .trim().split("\n").filter((path) => path.endsWith(".tsx") && !path.includes("/__tests__/"));
const candidates = new Map();
const conflicts = new Set();

for (const path of changed) {
  const original = git("show", `HEAD:${path}`);
  const current = readFileSync(resolve(root, path), "utf8");
  const before = literals(original, path);
  const after = literals(current, path);
  if (before.length !== after.length) continue;
  for (let index = 0; index < before.length; index += 1) {
    const oldText = before[index].text;
    const newText = after[index].text;
    if (!CJK.test(oldText) || oldText === newText) continue;
    if (candidates.has(oldText) && candidates.get(oldText) !== newText) conflicts.add(oldText);
    else candidates.set(oldText, newText);
  }
}
for (const value of conflicts) candidates.delete(value);
const replacements = [...candidates];

const testPaths = git("ls-tree", "-r", "--name-only", "HEAD", `${frontend}/src/__tests__`)
  .trim().split("\n").filter((path) => /\.tsx?$/.test(path));
for (const path of testPaths) writeFileSync(resolve(root, path), git("show", `HEAD:${path}`));

let changedTests = 0;
for (const path of testPaths) {
  const absolute = resolve(root, path);
  const source = readFileSync(absolute, "utf8");
  const nodes = literals(source, path);
  const edits = [];
  for (const node of nodes) {
    const updated = candidates.get(node.text) ?? node.text;
    if (updated === node.text) continue;
    const quote = source[node.start];
    const escaped = updated.replaceAll(quote, `\\${quote}`).replaceAll("\n", "\\n");
    edits.push({ start: node.start + 1, end: node.end - 1, text: escaped });
  }
  if (edits.length === 0) continue;
  let updated = source;
  for (const edit of edits.reverse()) updated = updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
  writeFileSync(absolute, updated);
  changedTests += 1;
}

console.log(`${replacements.length} mapeamentos; ${changedTests} arquivos de teste sincronizados; ${conflicts.size} conflitos ignorados.`);

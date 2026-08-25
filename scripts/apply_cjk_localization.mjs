#!/usr/bin/env node
/** Apply audited translations using JavaScript's UTF-16 offsets. */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const audit = JSON.parse(execFileSync("node", [resolve(root, "scripts/audit_cjk_ui.mjs"), "--json"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
const translations = JSON.parse(readFileSync(resolve(root, "scripts/.pt_br_cjk_cache.json"), "utf8"));
const byPath = new Map();
for (const item of audit) {
  if (!byPath.has(item.path)) byPath.set(item.path, []);
  byPath.get(item.path).push(item);
}

for (const [relative, edits] of byPath) {
  const path = resolve(root, relative);
  let source = readFileSync(path, "utf8");
  for (const item of edits.sort((left, right) => right.start - left.start)) {
    const original = item.value;
    const translated = translations[original.trim()] ?? original.trim();
    if (item.kind === "string") {
      const quote = source[item.start];
      const escaped = translated
        .replaceAll("\\", "\\\\")
        .replaceAll("\n", "\\n")
        .replaceAll(quote, `\\${quote}`);
      source = source.slice(0, item.start + 1) + escaped + source.slice(item.end - 1);
    } else {
      const leading = original.match(/^\s*/)?.[0] ?? "";
      const trailing = original.match(/\s*$/)?.[0] ?? "";
      const escaped = translated
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("{", "&#123;")
        .replaceAll("}", "&#125;");
      source = source.slice(0, item.start) + leading + escaped + trailing + source.slice(item.end);
    }
  }
  writeFileSync(path, source);
}

console.log(`${audit.length} ocorrências aplicadas com offsets UTF-16.`);

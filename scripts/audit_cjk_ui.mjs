#!/usr/bin/env node
/** Report actual CJK literals/JSX text from the TypeScript AST (comments excluded). */

import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = resolve(root, "engines/dramaclaw/frontend");
const require = createRequire(resolve(frontend, "package.json"));
const ts = require("typescript");
const CJK = /[\u3400-\u9fff]/;
const findings = [];

function tsxFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...tsxFiles(path));
    else if (entry.name.endsWith(".tsx")) files.push(path);
  }
  return files;
}

for (const path of tsxFiles(resolve(frontend, "src"))) {
  if (path.includes("/__tests__/") || path.endsWith(".test.tsx")) continue;
  const source = readFileSync(path, "utf8");
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    const stringLike = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
    const jsxText = ts.isJsxText(node);
    if ((stringLike || jsxText) && CJK.test(node.text)) {
      const start = jsxText ? node.pos : node.getStart(file);
      const line = file.getLineAndCharacterOfPosition(start).line + 1;
      findings.push({
        path: relative(root, path),
        line,
        kind: jsxText ? "jsx" : "string",
        start,
        end: node.getEnd(),
        value: node.text,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
}

if (process.argv.includes("--json")) console.log(JSON.stringify(findings));
else {
  for (const item of findings) console.log(`${item.path}:${item.line}: ${item.value.replaceAll("\n", " ").slice(0, 120)}`);
  console.log(`Total: ${findings.length}`);
}

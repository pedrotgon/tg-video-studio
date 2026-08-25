#!/usr/bin/env node
/**
 * Audit frontend source files (.tsx and .ts) for forbidden hardcoded CJK text in production UI.
 * Distinguishes:
 * - User-facing UI strings & JSX (STRICTLY FORBIDDEN to contain CJK)
 * - Comments (excluded automatically by TypeScript AST)
 * - Legitimate internal backend contracts & protocol serializers (categorized as backend contracts)
 */

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

/**
 * All React surfaces are audited. Plain TypeScript is included only when it
 * supplies labels, errors or menu entries rendered by the UI. Prompt compilers
 * and protocol adapters remain out of scope because their strings are model or
 * backend contracts, not interface copy.
 */
const USER_FACING_TS_PATHS = [
  /\/features\/viewer-kit\/viewerPurpose\.ts$/,
  /\/features\/canvas\/domain\/(cameraMovementPresets|catalogImageModels|groupColors|nodeDisplay)\.ts$/,
  /\/features\/canvas\/nodes\/shared\/videoModelCapabilities\.ts$/,
];

function isUserFacingSource(path) {
  return path.endsWith(".tsx") || USER_FACING_TS_PATHS.some((pattern) => pattern.test(path));
}

function isLegacyInputAlias(node) {
  const parent = node.parent;
  return (
    ts.isCallExpression(parent) &&
    ts.isPropertyAccessExpression(parent.expression) &&
    parent.expression.name.text === "includes"
  );
}

function sourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (path.endsWith(".tsx") || path.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

const allFiles = sourceFiles(resolve(frontend, "src")).filter((p) => {
  if (p.includes("/__tests__/") || p.includes("/__mocks__/")) return false;
  if (p.endsWith(".test.ts") || p.endsWith(".test.tsx")) return false;
  return isUserFacingSource(p);
});

for (const path of allFiles) {
  const relPath = relative(root, path);

  const source = readFileSync(path, "utf8");
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function visit(node) {
    const stringLike = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
    const jsxText = ts.isJsxText(node);

    // Chinese aliases accepted by String#includes are migration inputs for
    // pre-localized canvases. They are never rendered as interface copy.
    if ((stringLike || jsxText) && CJK.test(node.text) && !isLegacyInputAlias(node)) {
      const start = jsxText ? node.pos : node.getStart(file);
      const line = file.getLineAndCharacterOfPosition(start).line + 1;
      findings.push({
        path: relPath,
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

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(findings));
} else {
  for (const item of findings) {
    console.log(`${item.path}:${item.line}: ${item.value.replaceAll("\n", " ").slice(0, 120)}`);
  }
  console.log(`Total: ${findings.length}`);
}

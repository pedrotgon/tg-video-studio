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

/** Path patterns explicitly designated as internal backend contracts, engine schemas, or AI prompt compilers */
const CONTRACT_PATH_PATTERNS = [
  /\/features\/freezone\/capabilities\//,
  /\/features\/freezone\/commit\//,
  /\/features\/freezone\/context\//,
  /\/features\/canvas\/application\//,
  /\/features\/canvas\/domain\//,
  /scene-environment-contract\.ts$/,
  /audio-prereqs\.ts$/,
  /spec-extract\.ts$/,
  /task-notification-label\.ts$/,
  /directorManifest\.ts$/,
  /poses\.ts$/,
  /viewerApp\.ts$/,
  /viewerPurpose\.ts$/,
  /shotMetadataStore\.ts$/,
  /api-errors\.ts$/,
  /audio-type\.ts$/,
  /scene-type\.ts$/,
  /time-of-day\.ts$/,
  /login-community\.ts$/,
  /project-permissions\.ts$/,
  /character-main-copy\.ts$/,
  /dom-reconciliation-guard\.ts$/,
  /skill-i18n\.ts$/,
  /assetLibraryItems\.ts$/,
  /assetDropStore\.ts$/,
  /canvasStore\.ts$/,
  /huimeng\.ts$/,
  /media\.ts$/,
  /use-superchat\.ts$/,
  /canvasSyncCore\.ts$/,
  /videoModelCapabilities\.ts$/,
];

function isContractPath(path) {
  return CONTRACT_PATH_PATTERNS.some((pattern) => pattern.test(path));
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
  return true;
});

for (const path of allFiles) {
  const relPath = relative(root, path);

  // If this file is a known backend contract or schema file, skip checking its internal protocol literals
  if (isContractPath(path)) continue;

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

    if ((stringLike || jsxText) && CJK.test(node.text)) {
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

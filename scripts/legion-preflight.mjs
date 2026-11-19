import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const registryPath = path.join(root, "config", "legion", "modules.json");
const statusPath = path.join(root, "docs", "LEGION-MODULE-STATUS.yml");

function fail(message) {
  errors.push(message);
}

let registry;
try {
  registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
} catch (error) {
  console.error(JSON.stringify({ ok: false, errors: [`Cannot read module registry: ${error.message}`] }, null, 2));
  process.exit(1);
}

if (registry.schema_version !== 1) fail("Unsupported module registry schema_version.");
if (!Array.isArray(registry.modules) || registry.modules.length === 0) fail("Registry must contain a non-empty modules array.");

const allowedStatuses = new Set(["implemented", "partial", "planned", "blocked"]);
const ids = new Set();

for (const module of registry.modules ?? []) {
  if (!module.id || ids.has(module.id)) fail(`Missing or duplicate module id: ${module.id ?? "(empty)"}`);
  ids.add(module.id);
  if (!allowedStatuses.has(module.status)) fail(`Invalid status for ${module.id}: ${module.status}`);
  if (!Array.isArray(module.entrypoints) || module.entrypoints.length === 0) {
    fail(`Module ${module.id} must declare at least one evidence entrypoint.`);
    continue;
  }
  for (const entrypoint of module.entrypoints) {
    const absolute = path.resolve(root, entrypoint);
    if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute)) {
      fail(`Missing or out-of-repository evidence path for ${module.id}: ${entrypoint}`);
    }
  }
}

const governance = registry.governance ?? {};
for (const key of [
  "model_output_is_untrusted",
  "require_human_review_before_merge",
  "require_human_approval_before_production_deploy",
  "allow_secret_exfiltration"
]) {
  if (governance[key] !== true) fail(`Required governance control must be true: ${key}`);
}
for (const key of [
  "allow_arbitrary_shell_from_model_output",
  "allow_public_self_hosted_runners_for_untrusted_code",
  "credentials_in_git"
]) {
  if (governance[key] !== false) fail(`Prohibited capability must remain false: ${key}`);
}

let sourceStatuses = {};
try {
  const yaml = fs.readFileSync(statusPath, "utf8");
  const pattern = /^  ([a-z_]+):\r?\n    status: (implemented|partial|planned|blocked)$/gm;
  sourceStatuses = Object.fromEntries([...yaml.matchAll(pattern)].map((match) => [match[1], match[2]]));
} catch (error) {
  fail(`Cannot read canonical status document: ${error.message}`);
}

const registryStatuses = Object.fromEntries((registry.modules ?? []).map((module) => [module.id, module.status]));
if (JSON.stringify(Object.entries(registryStatuses).sort()) !== JSON.stringify(Object.entries(sourceStatuses).sort())) {
  fail("JSON registry statuses do not match docs/LEGION-MODULE-STATUS.yml.");
}

const report = {
  ok: errors.length === 0,
  project: registry.project,
  modules_checked: registry.modules?.length ?? 0,
  evidence_paths_checked: (registry.modules ?? []).reduce((total, module) => total + (module.entrypoints?.length ?? 0), 0),
  statuses_match_canonical_yaml: errors.every((error) => !error.includes("do not match")),
  governance_controls_checked: 7,
  errors
};

console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;

import fs from "node:fs/promises";
import { renderFactoryProposalMarkdown } from "../lib/legion-factory.js";

function fail(message) { console.error(message); process.exit(1); }
const repository = process.env.GITHUB_REPOSITORY || "";
const issueNumber = Number(process.env.ISSUE_NUMBER);
const plannerRunId = String(process.env.PLANNER_RUN_ID || "");
const runId = String(process.env.GITHUB_RUN_ID || "");
const token = process.env.GITHUB_TOKEN;
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) fail("Repository context is invalid.");
if (!Number.isSafeInteger(issueNumber) || issueNumber < 1 || !/^\d+$/.test(plannerRunId) ||
    !/^\d+$/.test(runId) || !token) fail("Publish metadata or GitHub token is missing.");

let payload;
try { payload = JSON.parse(await fs.readFile("factory-proposal/legion-factory-proposal.json", "utf8")); }
catch { fail("Factory proposal artifact is missing or invalid JSON."); }
if (payload?.schema_version !== 1 || Number(payload?.issue?.number) !== issueNumber ||
    String(payload?.planner?.run_id) !== plannerRunId) fail("Factory proposal provenance does not match this dispatch.");
const markdown = renderFactoryProposalMarkdown(payload);
const [owner, repo] = repository.split("/");
const apiBase = "https://api.github.com/repos/" + owner + "/" + repo;

async function githubApi(path, options = {}) {
  const method = options.method || "GET";
  const body = options.body;
  const response = await fetch(apiBase + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.message === "string" ? data.message.slice(0, 240) : "request rejected";
    throw new Error("GitHub API " + method + " " + path + " failed (HTTP " + response.status + ": " + detail + ").");
  }
  return data;
}
const pauseBetweenWrites = () => new Promise((resolve) => setTimeout(resolve, 1100));
const baseBranch = "main";
const branchName = "legion/factory/issue-" + issueNumber + "-run-" + runId;
const proposalPath = "docs/legion-factory-proposals/issue-" + issueNumber + "-run-" + runId + ".md";

const baseRef = await githubApi("/git/ref/heads/" + baseBranch);
const baseSha = baseRef?.object?.sha;
if (!/^[a-f0-9]{40}$/i.test(String(baseSha || ""))) fail("Could not resolve the main branch commit.");
const baseCommit = await githubApi("/git/commits/" + baseSha);
if (!baseCommit?.tree?.sha) fail("Could not resolve the main branch tree.");

const blob = await githubApi("/git/blobs", { method: "POST", body: { content: markdown, encoding: "utf-8" } });
if (!blob?.sha) fail("GitHub did not return a proposal blob.");
await pauseBetweenWrites();

const tree = await githubApi("/git/trees", {
  method: "POST",
  body: { base_tree: baseCommit.tree.sha, tree: [{ path: proposalPath, mode: "100644", type: "blob", sha: blob.sha }] }
});
if (!tree?.sha) fail("GitHub did not return a proposal tree.");
await pauseBetweenWrites();

const commit = await githubApi("/git/commits", {
  method: "POST",
  body: { message: "docs(legion): add factory proposal for issue #" + issueNumber, tree: tree.sha, parents: [baseSha] }
});
if (!commit?.sha) fail("GitHub did not return the proposal commit.");
await pauseBetweenWrites();

await githubApi("/git/refs", { method: "POST", body: { ref: "refs/heads/" + branchName, sha: commit.sha } });
await pauseBetweenWrites();

const title = ("[LEGION FACTORY] Issue #" + issueNumber + ": " + payload.proposal.title).slice(0, 240);
const body = [
  "## Generated implementation proposal", "",
  "Source issue: https://github.com/" + repository + "/issues/" + issueNumber,
  "MASTER BRAIN / AGENT SWARM run: https://github.com/" + repository + "/actions/runs/" + plannerRunId,
  "Factory run: https://github.com/" + repository + "/actions/runs/" + runId, "",
  "This is a **draft proposal PR**. It contains one generated Markdown blueprint only; it does not modify application source code, run generated commands, merge, or deploy.", "",
  "Please verify all claims and acceptance criteria before implementation.", "",
  "Proposal file: " + proposalPath
].join("\n");
const pullRequest = await githubApi("/pulls", {
  method: "POST",
  body: { title, head: branchName, base: baseBranch, body, draft: true, maintainer_can_modify: true }
});
if (!pullRequest?.html_url) fail("GitHub did not return the draft pull request URL.");

const summary = [
  "# LEGION Factory draft PR created", "",
  "- Pull request: " + pullRequest.html_url,
  "- Branch: " + branchName,
  "- Proposal file: " + proposalPath,
  "- Mode: documentation-only implementation blueprint.",
  "- Merge/deploy: not performed."
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) await fs.writeFile(process.env.GITHUB_STEP_SUMMARY, summary + "\n", { flag: "a" });
console.log("LEGION factory draft pull request created: " + pullRequest.html_url);

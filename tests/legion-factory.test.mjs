import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFactoryProposal,
  renderFactoryProposalMarkdown,
  validatePlannerArtifacts
} from "../lib/legion-factory.js";

const validPlan = {
  issue_number: 41,
  summary: "Integrate the planner, specialist workers, and proposal factory.",
  task_type: "architecture",
  risk: "medium",
  human_approval_required: true,
  subtasks: [{ role: "Architect", objective: "Map interfaces.", deliverable: "Architecture outline." }],
  execution: "PLAN_PLUS_READ_ONLY_SPECIALIST_WORKERS_NO_SIDE_EFFECTS"
};
const validWorkers = {
  issue_number: 41, concurrency_limit: 3, worker_count: 1, completed_count: 1, failed_count: 0,
  execution: "READ_ONLY_ANALYSIS_NO_TOOLS_NO_REPOSITORY_WRITES",
  workers: [{
    role: "Architect", status: "completed", summary: "A bounded orchestration design is feasible.",
    findings: ["Reuse the existing issue queue."], risks: ["Provider spend must remain bounded."],
    questions: [], deliverable: "A reviewed proposal."
  }]
};
const validProposal = {
  title: "Connect the factory to the LEGION queue",
  executive_summary: "Create a documented and reviewable path from planning to proposal PR.",
  architecture: "The workflow consumes the validated planner and worker artifact.",
  implementation_steps: ["Validate provenance.", "Build a proposal document.", "Open a draft pull request."],
  test_plan: ["Test issue/run mismatch rejection.", "Test output validation.", "Run repository CI."],
  risks: ["Treat model output as untrusted."],
  acceptance_criteria: ["Only one fixed Markdown proposal file is written."],
  open_questions: ["Which code changes should be prioritized after review?"]
};

test("planner and swarm artifacts are joined only for the same issue and completed workers", () => {
  const result = validatePlannerArtifacts(validPlan, validWorkers, 41);
  assert.equal(result.issueNumber, 41);
  assert.equal(result.workers.length, 1);
  assert.equal(result.risk, "medium");
});
test("planner artifact issue mismatch is rejected", () => {
  assert.throws(() => validatePlannerArtifacts(validPlan, validWorkers, 42), /do not match/);
});
test("incomplete specialist runs are blocked before factory generation", () => {
  const incomplete = { ...validWorkers, failed_count: 1 };
  assert.throws(() => validatePlannerArtifacts(validPlan, incomplete, 41), /did not complete cleanly/);
});
test("proposal fields are bounded and secrets are redacted", () => {
  const proposal = normalizeFactoryProposal({
    ...validProposal, risks: ["Leaked token ghp_123456789012345678901234567890123456"]
  });
  assert.equal(proposal.humanApprovalRequired, true);
  assert.match(proposal.risks[0], /REDACTED/);
});
test("rendered proposal marks approval boundary and does not pass through raw HTML", () => {
  const markdown = renderFactoryProposalMarkdown({
    issue: { number: 41 }, planner: { run_id: "123456" },
    masterBrain: { risk: "medium" }, agentSwarm: { completed_count: 1 },
    proposal: { ...validProposal, architecture: "Use existing <script> boundaries." }
  });
  assert.match(markdown, /Human approval required: yes/);
  assert.match(markdown, /&lt;script&gt;/);
  assert.match(markdown, /draft/);
});
test("non-object proposal output is rejected", () => {
  assert.throws(() => normalizeFactoryProposal("not json"), /JSON object/);
});

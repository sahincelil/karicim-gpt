const SECRET_PATTERNS = [
  /\\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\\b/g,
  /\\bxai-[A-Za-z0-9_-]{20,}\\b/g,
  /\\bgh[pousr]_[A-Za-z0-9_]{20,}\\b/g,
  /\\bgithub_pat_[A-Za-z0-9_]{20,}\\b/g,
  /\\bAIza[0-9A-Za-z_-]{20,}\\b/g,
  /((?:api[_-]?key|token|secret|password)\\s*[:=]\\s*)[^\\s'"]{12,}/gi
];

export function cleanFactoryText(value, maxLength = 1200) {
  if (typeof value !== "string") return "";
  let text = value.replace(/\\u0000/g, "").replace(/[\\u0001-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]/g, "");
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, (match, prefix) => prefix ? prefix + "[REDACTED]" : "[REDACTED]");
  }
  return text.trim().slice(0, maxLength);
}

function cleanList(value, maxItems = 8, maxLength = 900) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => cleanFactoryText(item, maxLength)).filter(Boolean);
}

export function validatePlannerArtifacts(plan, workers, expectedIssueNumber) {
  const issueNumber = Number(expectedIssueNumber);
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) throw new Error("A positive issue number is required.");
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("Planner artifact must be an object.");
  if (!workers || typeof workers !== "object" || Array.isArray(workers)) throw new Error("Worker artifact must be an object.");
  if (plan.issue_number !== issueNumber || workers.issue_number !== issueNumber) throw new Error("Planner artifacts do not match the selected issue.");
  if (plan.execution !== "PLAN_PLUS_READ_ONLY_SPECIALIST_WORKERS_NO_SIDE_EFFECTS") throw new Error("Planner artifact execution mode is not recognized.");
  if (workers.execution !== "READ_ONLY_ANALYSIS_NO_TOOLS_NO_REPOSITORY_WRITES") throw new Error("Worker artifact execution mode is not recognized.");
  if (!cleanFactoryText(plan.summary, 1000) || !Array.isArray(plan.subtasks) || plan.subtasks.length < 1 || plan.subtasks.length > 5) {
    throw new Error("Planner artifact is incomplete or exceeds the subtask limit.");
  }
  if (!Array.isArray(workers.workers) || workers.workers.length < 1 || workers.workers.length > 5) throw new Error("Worker artifact is incomplete or exceeds the worker limit.");
  if (workers.worker_count !== workers.workers.length || workers.completed_count !== workers.workers.length ||
      workers.failed_count !== 0 || workers.concurrency_limit !== 3 ||
      workers.workers.some((worker) => worker?.status !== "completed")) {
    throw new Error("The specialist swarm did not complete cleanly; factory generation is blocked.");
  }
  return {
    issueNumber,
    summary: cleanFactoryText(plan.summary, 1000),
    taskType: cleanFactoryText(plan.task_type, 80),
    risk: ["low", "medium", "high"].includes(plan.risk) ? plan.risk : "high",
    humanApprovalRequired: plan.human_approval_required === true,
    subtasks: plan.subtasks.length,
    workers: workers.workers.map((worker) => ({
      role: cleanFactoryText(worker.role, 80),
      summary: cleanFactoryText(worker.summary, 800),
      findings: cleanList(worker.findings, 5, 500),
      risks: cleanList(worker.risks, 5, 500),
      questions: cleanList(worker.questions, 5, 500),
      deliverable: cleanFactoryText(worker.deliverable, 800)
    }))
  };
}

export function normalizeFactoryProposal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Factory model output must be a JSON object.");
  const proposal = {
    title: cleanFactoryText(value.title, 160),
    executiveSummary: cleanFactoryText(value.executive_summary, 2400),
    architecture: cleanFactoryText(value.architecture, 3000),
    implementationSteps: cleanList(value.implementation_steps, 10, 1000),
    testPlan: cleanList(value.test_plan, 10, 1000),
    risks: cleanList(value.risks, 10, 1000),
    acceptanceCriteria: cleanList(value.acceptance_criteria, 10, 800),
    openQuestions: cleanList(value.open_questions, 8, 800),
    humanApprovalRequired: true
  };
  if (!proposal.title || !proposal.executiveSummary || !proposal.architecture ||
      proposal.implementationSteps.length === 0 || proposal.testPlan.length === 0) {
    throw new Error("Factory proposal is missing a required section.");
  }
  return proposal;
}

function markdownText(value, maxLength = 2400) {
  return cleanFactoryText(value, maxLength)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .split(String.fromCharCode(96)).join("ˋ");
}

function markdownList(items) {
  return items.length ? items.map((item) => "- " + markdownText(item, 1000).replace(/\\r?\\n/g, " ")).join("\\n") : "- None recorded.";
}

export function renderFactoryProposalMarkdown(payload) {
  const proposal = normalizeFactoryProposal(payload?.proposal);
  const issue = payload?.issue ?? {};
  const planner = payload?.planner ?? {};
  const master = payload?.masterBrain ?? {};
  const swarm = payload?.agentSwarm ?? {};
  const issueNumber = Number(issue.number);
  const plannerRunId = String(planner.run_id ?? "");
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1 || !/^\\d+$/.test(plannerRunId)) throw new Error("Factory provenance metadata is invalid.");
  const lines = [
    "# " + markdownText(proposal.title, 160),
    "",
    "> AI-generated implementation proposal. This is untrusted planning output, not an approved change. No source code, deployment, or external side effect is included.",
    "",
    "## Provenance",
    "",
    "- Source issue: #" + issueNumber,
    "- MASTER BRAIN / AGENT SWARM run: " + plannerRunId,
    "- Risk classification: " + markdownText(master.risk || "high", 40),
    "- Human approval required: yes",
    "- Specialist workers completed: " + (Number(swarm.completed_count) || 0),
    "",
    "## Executive summary",
    "",
    markdownText(proposal.executiveSummary),
    "",
    "## Architecture",
    "",
    markdownText(proposal.architecture, 3000),
    "",
    "## Proposed implementation sequence",
    "",
    markdownList(proposal.implementationSteps),
    "",
    "## Test strategy",
    "",
    markdownList(proposal.testPlan),
    "",
    "## Risks and mitigations",
    "",
    markdownList(proposal.risks),
    "",
    "## Acceptance criteria",
    "",
    markdownList(proposal.acceptanceCriteria),
    "",
    "## Open questions",
    "",
    markdownList(proposal.openQuestions),
    "",
    "## Review checklist",
    "",
    "- [ ] Verify every technical claim against the current codebase.",
    "- [ ] Review the proposed scope and data boundaries.",
    "- [ ] Implement accepted changes separately on a reviewed feature branch.",
    "- [ ] Run the complete test suite and inspect security implications.",
    "- [ ] Obtain human approval before merge or deployment.",
    ""
  ];
  const markdown = lines.join("\\n");
  if (Buffer.byteLength(markdown, "utf8") > 64000) throw new Error("Rendered factory proposal exceeds the size limit.");
  return markdown;
}

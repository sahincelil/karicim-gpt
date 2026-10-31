# ASI–AGI Research Charter

Status: vision and research charter; not a claim of achieved AGI or ASI.
Project: KaricimGPT / COMMAND-0
Starting budget: 0; free and local resources only unless separately approved.

## Vision

Build a durable, independent AI research and engineering organization that advances from useful, trustworthy AI software toward increasingly capable general-purpose systems. The long-term ambition includes original model research, agent architectures, memory, evaluation, compute infrastructure, energy systems, robotics, and sustainable economic foundations.

"Empire" describes the scale of the ambition, not unchecked power. The project must remain lawful, accountable, transparent about limitations, and beneficial to people.

## What we mean by the terms

- **AI product:** a working system that solves a defined user problem.
- **Agent:** a system that plans and uses explicitly permitted tools within limits.
- **AGI research:** research into broad, transferable capabilities across varied tasks. No single demo proves AGI.
- **ASI research:** a distant research horizon concerning capabilities that substantially exceed human performance across many domains. It is not a present capability or a guaranteed outcome.

## Development ladder

1. **Reliable foundation:** secure API, clear identity boundaries, persistent memory controls, observability, repeatable tests.
2. **Bounded agents:** task plans, tool allowlists, budgets, deadlines, cancellation, approval gates, and audit trails.
3. **Evaluation lab:** reproducible task suites measuring accuracy, grounding, robustness, latency, cost, and safety.
4. **Research prototypes:** memory retrieval, planning, multi-agent coordination, model adaptation, and local/open-model experiments.
5. **Original research:** publishable methods and independently reproducible results, where feasible.
6. **Infrastructure:** only after demonstrated need and funding—compute, energy efficiency, hardware, and robotics.
7. **Responsible scaling:** independent review, security testing, staged deployment, monitoring, incident response, and rollback.

Progression is evidence-gated. A stage is not complete because a feature was named or a document was written.

## First 90 days

The immediate objective is not to train a frontier model. It is to build and evaluate a small trustworthy agent prototype using existing code and free/local resources.

Priority experiments:
- Can an agent complete a fixed task set using only approved tools?
- Does persistent memory retrieve relevant facts without leaking data between users?
- Can the system detect uncertainty, refuse unsafe actions, and request approval before external side effects?

Each experiment must record its hypothesis, setup, inputs, outputs, metrics, failures, limitations, and reproduction steps.

## Non-negotiable safeguards

- No unauthorized access, credential theft, stealth, malware, or bypassing access controls.
- No autonomous spending, borrowing, account changes, public releases, production deployment, or destructive operations.
- No arbitrary shell execution or unrestricted tool access for agents.
- Secrets remain outside source control and are never printed into logs.
- User data is minimized, isolated, access-controlled, and given documented retention and deletion paths.
- Human approval is required for consequential external actions.
- Security and capability claims must be supported by tests and independent evidence.
- Treat model outputs, prompts, files, web pages, and tool responses as untrusted input.

## Zero-budget operating rules

- Prefer existing tools, free tiers, and local execution.
- Check quotas and terms before using a free service; "free" does not mean unlimited.
- Do not provision paid infrastructure or incur recurring charges without explicit approval.
- Do not train large models or purchase hardware during the initial phase.
- Track all actual costs; estimates must be labeled as estimates.

## Success measures

The first phase succeeds only if it produces:
- a runnable bounded prototype;
- repeatable evaluation results;
- tests for authorization and user-data isolation;
- a clear threat model and risk register;
- one validated real-world problem worth solving;
- a realistic next-stage cost and research plan.

## Governance

The project owner sets goals and approves consequential decisions. The engineering process documents what was inspected, changed, tested, and not verified. No assistant or agent may represent an unapproved action as completed.

## Reality statement

The path from today's AI systems to AGI—and especially ASI—is scientifically uncertain, technically difficult, and potentially decades-long. This charter is an ambitious research direction, not a promise. The project earns credibility through working systems, reproducible evidence, responsible conduct, and sustainable progress.

const MAX_PLAN_STEPS = 8;
const MAX_EVIDENCE = 12;
const MAX_TEXT = 2000;

function clean(value, max = MAX_TEXT) {
  return String(value || '').trim().slice(0, max);
}

function scoreEvidence(item) {
  const quality = Number(item?.quality);
  const relevance = Number(item?.relevance);
  const independent = Number(item?.independent);
  const values = [quality, relevance, independent].filter(Number.isFinite);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Math.max(0, Math.min(1, value)), 0) / values.length;
}

export function synthesizeEvidence(evidence = []) {
  return evidence.slice(0, MAX_EVIDENCE).map((item, index) => ({
    id: clean(item?.id || `evidence-${index + 1}`, 100),
    claim: clean(item?.claim),
    source: clean(item?.source, 500),
    quality: Number.isFinite(Number(item?.quality)) ? Math.max(0, Math.min(1, Number(item.quality))) : 0.5,
    relevance: Number.isFinite(Number(item?.relevance)) ? Math.max(0, Math.min(1, Number(item.relevance))) : 0.5,
    independent: Number.isFinite(Number(item?.independent)) ? Math.max(0, Math.min(1, Number(item.independent))) : 0.5,
    score: scoreEvidence(item)
  })).sort((a, b) => b.score - a.score);
}

export function makePlan(goal, lessons = [], evidence = []) {
  const cleanGoal = clean(goal);
  if (!cleanGoal) return [];
  const relevantLessons = lessons.slice(0, 5).map((item) => clean(item?.text)).filter(Boolean);
  const rankedEvidence = synthesizeEvidence(evidence).slice(0, 5);
  const steps = [
    { id: 'define', action: `Define a measurable success condition for: ${cleanGoal}`, reversible: true },
    { id: 'recall', action: relevantLessons.length ? `Apply relevant learned lessons: ${relevantLessons.join(' | ')}` : 'Search memory for relevant prior outcomes.', reversible: true },
    { id: 'verify', action: rankedEvidence.length ? `Verify the strongest available evidence before acting (${rankedEvidence.length} candidates).` : 'Acquire and verify evidence before acting.', reversible: true },
    { id: 'execute', action: 'Execute the smallest bounded action that can test the hypothesis.', reversible: true },
    { id: 'evaluate', action: 'Measure the result against the success condition.', reversible: true },
    { id: 'learn', action: 'Persist a concise lesson from the outcome and update strategy scores.', reversible: true }
  ];
  return steps.slice(0, MAX_PLAN_STEPS);
}

export function reflect({ goal = '', result = {}, lessons = [], evidence = [] } = {}) {
  const success = Boolean(result.success);
  const confidence = synthesizeEvidence(evidence).reduce((sum, item) => sum + item.score, 0) / Math.max(1, Math.min(MAX_EVIDENCE, evidence.length));
  const nextAction = success
    ? 'Generalize the successful strategy and test it on a novel but bounded task.'
    : 'Classify the failure, preserve the lesson, and retry with a different bounded strategy.';
  return {
    goal: clean(goal),
    outcome: success ? 'success' : 'failure',
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(3)),
    lessonsUsed: lessons.slice(0, 5).map((item) => clean(item?.text)).filter(Boolean),
    nextAction,
    plan: makePlan(goal, lessons, evidence),
    reversible: true
  };
}

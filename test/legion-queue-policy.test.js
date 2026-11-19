import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const trustedAssociations = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

function mayStartIssueRun({ eventName, title = '', authorAssociation = '' }) {
  return eventName === 'workflow_dispatch' || (
    eventName === 'issues' &&
    title.startsWith('[LEGION]') &&
    trustedAssociations.has(authorAssociation)
  );
}

for (const association of trustedAssociations) {
  assert.equal(mayStartIssueRun({
    eventName: 'issues',
    title: '[LEGION] approved task',
    authorAssociation: association
  }), true, association + ' should be allowed');
}

for (const association of ['CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR', 'NONE', '']) {
  assert.equal(mayStartIssueRun({
    eventName: 'issues',
    title: '[LEGION] public request',
    authorAssociation: association
  }), false, association + ' must not trigger provider usage');
}

assert.equal(mayStartIssueRun({
  eventName: 'issues',
  title: 'ordinary issue',
  authorAssociation: 'OWNER'
}), false, 'non-LEGION issue must not trigger the planner');

assert.equal(mayStartIssueRun({
  eventName: 'workflow_dispatch'
}), true, 'manual dispatch remains available through GitHub Actions permissions');

const workflow = readFileSync('.github/workflows/legion-planner.yml', 'utf8');
const jobGate = workflow.split('\n').find((line) => line.trim().startsWith('if:')) || '';
assert.match(jobGate, /github\.event_name == 'workflow_dispatch'/);
assert.match(jobGate, /startsWith\(github\.event\.issue\.title, '\[LEGION\]'\)/);
assert.match(jobGate, /contains\(fromJSON\('\["OWNER","MEMBER","COLLABORATOR"\]'\), github\.event\.issue\.author_association\)/);
assert.match(workflow, /contents: none/);
assert.match(workflow, /issues: write/);
assert.ok(workflow.includes("group: legion-planner-${{ github.event.issue.number || inputs.issue_number || 'manual' }}"));

console.log('LEGION queue authorization policy tests passed.');

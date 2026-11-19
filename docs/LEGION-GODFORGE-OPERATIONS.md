# LEGION GODFORGE Operations

This document turns the existing command-center design into a repeatable repository preflight. It does not claim that planned modules are running services.

## Repository map

- `config/legion/modules.json`: machine-readable module map and governance invariants.
- `docs/LEGION-MODULE-STATUS.yml`: canonical human-maintained module status.
- `scripts/legion-preflight.mjs`: checks module IDs, status values, evidence paths, and required governance controls.
- `tests/legion-godforge.test.mjs`: focused Node.js regression test for the preflight.
- `.github/workflows/legion-godforge.yml`: read-only CI workflow for pull requests and main-branch changes.

## Operating sequence

1. Open a GitHub Issue using the existing `[LEGION]` task form.
2. Keep task scope bounded and exclude credentials, patient records, confidential workplace data, and other sensitive material.
3. Run the planner and review its proposed task breakdown.
4. Implement changes on a feature branch. The workflow checks the module registry and evidence references.
5. Run the project's existing `npm run check` suite through the existing CI workflows.
6. Open a pull request. A human reviews the diff and CI evidence before merge.
7. Production deployment, rollback, external communications, account-permission changes, and spending remain separate approval-gated actions.

## Module interpretation

The JSON registry mirrors status values from `docs/LEGION-MODULE-STATUS.yml`. The preflight fails on drift, missing evidence paths, duplicate IDs, invalid states, or weakened governance invariants.

- `implemented` means repository source or workflow exists, not that production is live.
- `partial` means some components exist but integration or live evidence is incomplete.
- `planned` means design or documentation exists.
- `blocked` means an external permission, credential, or enrolled resource is still required.

## Local verification

Requires Node.js 24 or newer:

```sh
node scripts/legion-preflight.mjs
node --test tests/legion-godforge.test.mjs
npm run check
```

The GitHub Actions workflow uses read-only repository permissions and does not consume secrets or execute deployment steps.

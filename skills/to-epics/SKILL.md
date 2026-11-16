---
name: to-epics
description: Turn a PRD, roadmap, or project discussion into a small set of triaged, implementation-ready domain epics with dependency-aware checklist slices. Use when the user asks to plan work as epics, reduce issue clutter, or coordinate work across domains.
disable-model-invocation: true
---

# To Epics

Turn a body of planned work into a compact issue map that contributors can implement from the issue bodies. An **epic** is a durable domain outcome. A **slice** is a cohesive, verifiable part of that outcome that can be delivered in one PR or a clearly coordinated set of PRs.

## Workflow

### 1. Gather current context

- Read the referenced PRD, roadmap, ADRs, glossary, repository instructions, relevant source/config/tests, and current issues.
- Inspect the repository, tracker, labels, milestones, issue types, and dependency features. Treat checked-out files and live tracker state as authoritative over pasted history.
- Identify existing issues that already cover the work. Extend or link them instead of creating duplicates.
- Separate settled decisions from real unknowns. Resolve settled decisions in the issue body; make each unknown a bounded research/prototype slice with an owner and decision criterion.

### 2. Shape domain epics

- Group work by durable user or maintainer outcome and domain ownership, not by document chapter, source file, technical layer, or arbitrary phase.
- Separate outcomes that can be delivered and owned independently. Keep tightly coupled work together when splitting it would create coordination overhead.
- Keep the issue count as small as possible while preserving useful ownership and progress visibility. Do not create one issue per checklist item.
- Draw dependency waves. Add an edge only when the downstream epic cannot make useful progress until the upstream epic is complete. Put slice-level ordering inside the epic; keep truly independent slices parallel.
- Check for cycles, missing prerequisites, hidden owner actions, release gates, and slices with no clear acceptance evidence.

### 3. Make every slice implementable

For each slice, state:

- the user or maintainer outcome;
- the behavior and important edge cases in scope;
- API, markup, compatibility, security, or data constraints that shape the implementation;
- what is deliberately out of scope;
- the tests, host checks, or other evidence that demonstrate completion;
- documentation, changeset, migration, or release work that must accompany it;
- its actual prerequisites and whether it can proceed in parallel.

Write acceptance criteria as observable checks, not aspirations. Replace “add tests” with the behaviors the tests must assert. Replace “works correctly” with the expected result for concrete inputs or states. If a detail cannot be determined from source material, record the question, decision owner, and what work is blocked by the answer.

### 4. Triage each epic

Every epic body must include:

- **Priority and rationale**, using the repository's existing scale where available;
- **Release or milestone** and domain/category;
- **Blocked by** and **unblocks** references;
- **Owner-only actions** such as repository, hosting, or publishing settings;
- **Outcome and context**, including current behavior and why it needs to change;
- **Scope and constraints**, including relevant decisions;
- **Slices** with detailed acceptance criteria;
- **Dependencies and sequencing**, **out of scope**, **risks/open questions**;
- **Verification** and a binary epic-level completion condition.

Apply the repo's epic type or epic label, a `triaged` label, the priority label, and the target milestone. Prefer a native GitHub issue type when available; use the `epic` label when issue types are unavailable or the repository uses labels for filtering. Reuse the existing priority vocabulary. If none exists, define a small scale once in the roadmap and create only the labels needed for this work. Do not invent estimates or assignees; state `unestimated` or `unassigned` when that information is not known.

### 5. Choose the tracker shape

- Prefer one issue per epic with Markdown checklist slices.
- Promote a slice to a sub-issue only when it needs separate discussion, ownership, external contribution, or independent tracking.
- Use native epic dependencies when available. Otherwise include `Blocked by: #N` in the blocked epic and describe the limitation in the roadmap.
- Keep issue bodies self-contained. Link supporting docs only when they are committed and accessible to implementors; repeat the decision or requirement that is essential to implementation.

### 6. Review before publishing

Present the proposed domains, priorities, slice counts, dependency waves, open decisions, and owner-only actions. Ask whether the boundaries, priorities, and gates are right. Show a representative full epic body when the user has not established the desired level of detail.

Do not create or edit tracker issues, labels, milestones, or public roadmap links until the user approves the concrete map, unless the user has already authorized publishing this exact map in the current conversation. If approval arrives, publish that reviewed map without asking again.

### 7. Publish and connect

- Create or reuse the epic label/type, triage/priority labels, and milestone.
- Create issues in dependency order so each blocker has a real tracker ID before adding edges.
- Put the goal, context, in-scope work, slice checklist, sequencing, acceptance evidence, out-of-scope items, risks, and completion criteria in each issue.
- Add native dependency edges using the tracker's required identifier. Do not infer an edge from ordering alone.
- Update the roadmap to a concise priority/wave index linking to the issues. Keep detailed implementation scope in the epic bodies, product rationale in the PRD, and durable technical decisions in ADRs.

### 8. Verify the published map

Re-read every issue and confirm:

- each epic has the required triage metadata and correct milestone;
- every slice is a rendered checklist item with concrete acceptance checks;
- priority in the body agrees with its label and roadmap;
- dependency direction matches the slice sequencing and contains no cycles;
- no issue relies on an inaccessible document or contradicts another issue;
- roadmap links resolve and every intended epic appears exactly once.

Report the issue URLs, priority/dependency map, verification performed, and any tracker limitation. Do not claim the epic is complete because its issue was created; it is complete only when its stated slices and owner actions are done.

## Triage guidance

Use the repository's priority scale. If none exists, a compact default is:

- **P0:** foundational critical-path work that blocks most delivery;
- **P1:** release-critical capability or gate;
- **P2:** required downstream work that follows a prerequisite.

Priority describes the epic's overall urgency. Explain mixed-priority owner tasks in the body rather than mislabeling the whole epic.

## GitHub conventions

- Infer the repository from `git remote -v`; use `gh` for reads and writes.
- Add a blocked-by edge to the **blocked issue** with `POST /repos/{owner}/{repo}/issues/{child}/dependencies/blocked_by`. Pass the blocker issue's numeric database `id`, not its issue number or node ID.
- If using `gh api`, obtain that database ID from `gh api repos/{owner}/{repo}/issues/{blocker} --jq .id`.
- Refer to implementation PRs as `Part of #N (Sx)`. Check a slice only after the PR merges and its acceptance evidence is present. Close the epic only after every required slice and owner action is complete.

## Epic body template

```markdown
## Triage
- **Priority:** [level and rationale]
- **Milestone:** [release]
- **Blocked by:** [issues or none]
- **Unblocks:** [issues or none]
- **Owner-only actions:** [actions or none]
- **Category:** [domain]

## Outcome
[Observable domain outcome]

## Context
[User/maintainer problem, current behavior, and why it matters]

## Scope and constraints
[Included behavior, API/markup/security constraints, settled decisions]

## Slices
- [ ] **S1 · [Outcome].** [Scope, edge cases, dependencies, and evidence.] **Acceptance:** [checkable result].
- [ ] **S2 · [Outcome].** [Scope, edge cases, dependencies, and evidence.] **Acceptance:** [checkable result].

## Dependencies and sequencing
[Cross-epic blockers, within-epic order, parallel work, and why each gate is real]

## Out of scope and risks
[Nearby work excluded; material risks/open questions, owner, and next step]

## Verification
[Specific commands, fixtures/hosts, docs, and release evidence]

## Completion
[Binary whole-epic completion condition]

## Slice delivery
PRs reference the epic and slice. Check items after merge and evidence. Keep slices here unless separate discussion or outside ownership justifies a sub-issue.
```

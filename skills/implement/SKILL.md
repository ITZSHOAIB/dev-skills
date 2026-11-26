---
name: implement
description: Implement a piece of work from a spec or tickets on its own branch, then open a draft PR for human review. Invoke with /implement <spec, issue, or tickets> [--no-pr].
disable-model-invocation: true
---

# Implement

Build the work described in the spec or tickets on its own branch, and hand it over as a **draft PR**. The human marks it ready and merges it: the skill never marks a PR ready, requests reviewers, approves, or merges.

## 1. Branch

- Run `git status --short`. Uncommitted work that is not part of this task: ask whether to stash it, commit it, or continue.
- Find the default branch with `gh repo view --json defaultBranchRef -q .defaultBranchRef.name` (or `git symbolic-ref refs/remotes/origin/HEAD`), then `git fetch origin`.
- On the default branch, or on a branch for other work: create `<type>/<issue>-<slug>` from `origin/<default>`, where `<type>` is the conventional commit type (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`). Leave out `<issue>-` when the work has no issue. Stay on the current branch only when the human says the work belongs there.
- Set `BASE=origin/<default>`. Review and the PR both compare against it.
- Read each issue the work comes from with `gh issue view`. Decide its link: `Closes #N` when this PR finishes the issue, `Part of #N (<slice>)` when it delivers one slice of an epic.

Done when you are on a work branch based on a fresh default branch, and every linked issue is marked `Closes` or `Part of`.

## 2. Build

Use /tdd where possible, at pre-agreed seams. Without the `tdd` skill, write each test first and watch it fail before writing the code.

Save the output of the first red run of the test that pins the main behaviour: it is the "before" in the PR's Evidence.

Run typechecking regularly and single test files regularly. Commit in small logical steps with conventional messages, each passing typecheck.

Done when every acceptance item of the spec or tickets is implemented, each with a test or a stated reason it has none, and the red run is saved.

## 3. Verify

Run, once each, every check CI runs that can run locally: the full test suite, typecheck, lint, and any build or package check. Take the list from `.github/workflows`, `AGENTS.md`, or `package.json` scripts. Checks that only run on the host (CodeQL, dependency review) wait for step 5. Add a changeset when the repo has `.changeset/` and the change is user-visible. Update docs the change makes wrong.

Keep the output of each command: with the saved red run, it becomes the PR's Evidence. A repo with no CI gets the commands you ran, and says so.

Done when every check that can run locally passes and the evidence is saved.

## 4. Review

Use /code-review with `$BASE` as the fixed point, and pass the spec path or the issue text as its spec so it does not stop to ask for one. Without the `code-review` skill, start one fresh subagent to review `git diff $BASE...HEAD` against the repo's documented standards and the spec, and say in Special things to note that the fallback ran. Fix every documented-rule violation and spec gap, and each judgement-call smell whose fix is small. A finding you keep on purpose goes into the PR's Special things to note with its reason. Rerun step 3's checks after the fixes.

Done when every finding is fixed or recorded with a reason.

## 5. Draft PR

Skip this step with `--no-pr`, or when the repo has no GitHub remote: print the PR title and body instead.

1. Push: `git push -u origin HEAD`. If the push is refused, stop and report.
2. Title: the conventional commit of the main change, under 72 characters.
3. Body: use the `pr` skill. It owns the sections:
   - the `Closes` and `Part of` lines from step 1;
   - **Summary**: the smallest view of the change;
   - **Special things to note**: deliberate omissions, kept review findings, follow-up work;
   - **Evidence**: the failing-then-passing test and the step 3 output;
   - **Merge Danger**.
4. Open it: write the body to a temp file and run `gh pr create --draft --base <default> --title "<title>" --body-file <file>`. If `gh pr view` shows a PR already open for this branch, update it with `gh pr edit --body-file <file>` and leave its draft state as it is.
5. Watch CI: run `gh pr checks --watch` in the background, for up to 15 minutes. If it reports no checks right after the PR opens, wait a minute and ask again; still none means the repo has no CI for PRs, so say that in Evidence.
   - A red check this change caused: fix it, push, and watch again, at most twice.
   - A red check it did not cause (flaky test, outage): name it in Special things to note.

Done when the draft PR is open, its body follows the `pr` template, and CI is green or each red check is explained in the body.

## 6. Hand off

Report the PR URL, the branch, the CI state, and any work deferred to a follow-up. Suggest `/guided-review <PR URL>` for the human's review. The human marks the PR ready when satisfied.

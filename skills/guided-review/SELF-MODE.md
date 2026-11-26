# Self mode

The human's own change, reviewed before they merge it. The same page collects their decisions; then this session applies the approved fixes.

Arguments: a fixed point (commit, branch, tag, `main`) and optionally a spec path. Ask for the fixed point if it is missing.

## Gather

1. Run `node <skill dir>/clean.mjs`.
2. Resolve the fixed point with `git rev-parse` and compute `BASE=$(git merge-base <fixed-point> HEAD)`. Confirm `git diff $BASE` is non-empty.
3. Run `git status --short`. If there is uncommitted work, ask whether to commit it first or review it as it is.
4. Find the spec, in this order: the path passed as an argument; issue references in `git log $BASE..HEAD` (`#123`, `Closes #45`), fetched with `gh issue view`; a file under `docs/`, `specs/`, or `.scratch/` matching the branch or feature. With none, ask the human once; "there isn't one" means the spec check reports `no spec available`.
5. Run the repo's type check and the tests covering the changed files, in the current working tree. On a failure, show the output and ask whether to continue.

Done when `BASE` is known, the human has settled any uncommitted work, and the checks are green or the human chose to continue.

## Claims

Each spec requirement is a claim. Record it in `claims` with `claim` set to the spec's short name or `#<issue>`, and `note` set to the requirement plus where it holds. A missing or wrong requirement with a scenario is a finding; behaviour nobody asked for is a question about scope.

The `cold` lens always runs here. Compare its paraphrase with the spec, or with the intent you hold when there is none. Each mismatch is a **paraphrase gap**: the code says something other than what was meant. A gap is a finding even when the behaviour is correct, because the fix may be a better name or a clearer structure; its scenario is the misreading a new maintainer would make.

## Build

Set `mode` to `self`, leave `pr.url` out, and set `pr.head` to the branch name (or the short SHA when detached), `pr.base` to the fixed point, `pr.sha` to `git rev-parse HEAD`, and `pr.title` to a short name for the change. Set `round` to 1, or 2 for a second round. A rebuild keeps the same slug, so the page keeps the human's earlier decisions for findings that are still listed.

## Hand off

1. Show the page as in PR mode (Orca inline, or the review server's address).
2. Tell the human to approve or dismiss each finding, then copy the prompt and paste it back into this chat. The prompt is the only channel: the page keeps decisions in their browser, out of your reach.
3. Apply the pasted items: check each against the code first, and say so with evidence when one is wrong instead of applying it. Edit the working tree only. Commit or push only when the human asks.
4. Rerun the checks from Gather step 5.
5. If a fix was large, offer one more round: a fresh `cold` lens, Verify, and a rebuild with `round` raised. Otherwise stop.

Done when you have reported the final state: fixes applied, findings dismissed with the human's reasons, and findings left open.

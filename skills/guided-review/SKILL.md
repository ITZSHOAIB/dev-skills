---
name: guided-review
description: Guided PR or branch review for a human reviewer — a short problem/solution summary, findings to approve or dismiss, and an implementor prompt that updates from those choices. Invoke with /guided-review <PR URL or number> [--deep] [--cold].
disable-model-invocation: true
---

# Guided review

The human reviews and decides. The agent finds candidates and drafts the hand-off; it never approves, rejects, or posts to the PR.

`<skill dir>` is the folder holding this SKILL.md. Needs `node` and `gh`; Tailscale and Orca are optional.

Cost discipline: one PR needs one diff read, a few targeted reads, and one small JSON file. Stay lean.

## 1. Gather

- First run `node <skill dir>/clean.mjs`: it deletes stored reviews of merged PRs (`--closed` also removes closed ones).
- `gh pr view <pr> --json title,body,headRefName,baseRefName,files` and `gh pr diff <pr>`, once each.
- Linked issues: every `#N` or issue URL in the body after a closing keyword (`Closes`, `Fixes`, `Resolves`) or a reference (`Part of`, `Refs`, `Epic`). Run `gh issue view <n> --json title,body,state,labels` once per issue, at most three. An issue that names a parent epic is followed one level up, within the same cap.
- Read beyond the diff only where a suspicion needs it (a caller, the server behind a client change). No broad exploration, no subagents unless a flag asks for them.
- Check out the branch and run the narrowest test command from `AGENTS.md`/`package.json`.

Done when each changed file is read, the PR body's test claims are checked against the one command run, and, where the body has them, its other claims are checked against the diff: the Summary shape, Special things to note, and Merge Danger (door and blast radius). A claim the diff contradicts, with a scenario, is a finding; a claim too vague to check is a question. What Special things to note lists as deliberately left out is not a defect. Each acceptance item of a linked issue is also a claim, checked against the code at the PR head: in this diff, or already on the base branch from an earlier PR (one `git grep` or `gh pr list --search "#<n>"` per item, no more). When the PR closes the issue, every item must hold at merge; a missing item is a finding when it has a scenario and a question otherwise. When the PR only refers to the issue, check just the items the PR says it covers, and list work for the issue that the PR adds beyond them as a question about scope. Record every claim you checked in `claims`, so the page shows that the check ran even when everything matches.

## 2. Find

At most six candidates, highest severity first; fold extras into one nit. Each has:
- `sev`: `blocking`, `should-fix`, or `nit`;
- `where`: `path:line`;
- `defect` (one sentence) and `scenario` (concrete input or state, then wrong behaviour);
- `fix` and `test` (the check that would catch it first; empty for a nit);
- optional `shape`: at most 8 lines placing the defect in the call tree, or sketching the fix. Add it only when it is shorter than the prose it replaces.

A suspicion without a scenario is dropped. A broken repo rule counts. A call only the human can make becomes a question, never a finding.

### Optional engines

Default is the one pass above. Add engines only when the human passes the flag; their output is candidates, so it goes through the same scenario filter and six-finding cap.

- `--deep`: start one subagent on the **Standards** axis of the `code-review` skill (repo docs plus the smell baseline) over the PR diff. Keep its hard violations and any smell that has a scenario; drop the rest.
- `--cold`: start one fresh subagent given only the diff (no PR body, commits, or conversation) to explain what the change does, what it assumes, and what surprises it, as in the `cold-review` skill's cold read. Also ask it for one shape view (call tree or diff-sketch) of what the code does; where that differs from the PR's Summary shape, treat the gap as a surprise. Verify each surprise against the code before it becomes a finding. Use it for PRs with real design decisions.

If a named skill is not installed, say so and continue with the one pass. The `code-review` Spec axis is not used: the linked-issue check in Gather already covers it at lower cost.

## 3. Build the review page

Write `data.json` in a scratch folder, then run `node <skill dir>/build.mjs <data.json>`. It stores `reviews/<owner>-<repo>-pr-<n>.{json,html}` inside the skill folder (git-ignored there, so nothing lands in any project repo) and, when `$ORCA_CHAT_SCRATCH_DIR` is set (Orca), copies the page there for inline display. Elsewhere, write `data.json` to any temp folder. `pr.url` is required: the file name and the cleanup both derive from it. The page is a fixed template: never write the HTML.

```json
{
  "pr": {"title": "", "url": "", "head": "", "base": "", "size": ""},
  "problem": "What this PR solves, 1-2 sentences.",
  "how": "How it solves it, 2-3 sentences.",
  "shape": "One text view of the change, at most 15 lines.",
  "claims": [{"claim": "Tests | Summary | Special things to note | Merge Danger | #<issue>", "status": "matches | contradicted | unclear | unverified", "note": "one line", "ref": "F1 or Q1, empty for matches"}],
  "verified": "Ran: ... Read only: ...",
  "repo": "absolute repo path",
  "commands": "the repo's verify commands",
  "findings": [{"id": "F1", "sev": "", "where": "", "defect": "", "scenario": "", "fix": "", "test": "", "shape": ""}],
  "questions": [{"id": "Q1", "text": ""}]
}
```

`shape` is the change as you read it in the diff, not a copy of the PR's Summary. Pick one view from the `pr` skill's Summary list (pseudocode, call tree, component tree, file tree, or a `diff` sketch of one of these) and choose the smallest that makes the point. Use no Mermaid: the page is self-contained and renders `shape` as plain text without wrapping, so keep lines under about 45 characters so they fit a phone screen. In a `diff` sketch, put `+` or `-` in the first column: the page colours those lines.

`claims` has one entry per claim the PR body makes, in the order above; leave out sections the body does not have. Linked-issue items come last, one entry each: `claim` is just `#<issue>` (it renders unwrapped) and `note` is the item plus where it holds, e.g. `docs page updated: website/artifacts.md (this PR)`. A `contradicted` claim points at its finding and an `unclear` one at its question. A claim this run could not re-check (a full-suite count, a CI result) is `unverified`, not `matches`.

The page gives the human Approve / Dismiss per finding, a comment box per finding and per question, and a live implementor prompt built from the approved findings with the human's comments attached. The agent does not write that prompt.

## 4. Hand off

Show the page with `::orca-visual{file="<slug>.html" title="Review PR <n>"}` on its own line when `$ORCA_CHAT_SCRATCH_DIR` is set (`<slug>` is what build.mjs prints). Then one line each for the top two or three findings. Make no verdict: no "approve", "LGTM", or "changes requested". Make sure the review server is up (`curl -s -m 2 http://<host>:8765/` answers; otherwise start `node <skill dir>/serve.mjs` in the background and read the address it prints) and give `http://<host>:8765/<slug>.html`. The server lists every stored review at `/`, binds the Tailscale IP only (127.0.0.1 without Tailscale), and stays up until the human asks to stop it. A shareable link beyond the tailnet means a Claude Docs copy, and only when asked.

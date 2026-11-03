---
name: guided-review
description: Guided PR or branch review for a human reviewer — a short problem/solution summary, findings to approve or dismiss, and an implementor prompt that updates from those choices. Invoke with /guided-review <PR URL or number>.
disable-model-invocation: true
---

# Guided review

The human reviews and decides. The agent finds candidates and drafts the hand-off; it never approves, rejects, or posts to the PR.

`<skill dir>` is the folder holding this SKILL.md. Needs `node` and `gh`; Tailscale and Orca are optional.

Cost discipline: one PR needs one diff read, a few targeted reads, and one small JSON file. Stay lean.

## 1. Gather

- First run `node <skill dir>/clean.mjs`: it deletes stored reviews of merged PRs (`--closed` also removes closed ones).
- `gh pr view <pr> --json title,body,headRefName,baseRefName,files` and `gh pr diff <pr>`, once each.
- Read beyond the diff only where a suspicion needs it (a caller, the server behind a client change). No broad exploration, no subagents.
- Check out the branch and run the narrowest test command from `AGENTS.md`/`package.json`.

Done when each changed file is read and the PR body's test claims are checked against the one command run.

## 2. Find

At most six candidates, highest severity first; fold extras into one nit. Each has:
- `sev`: `blocking`, `should-fix`, or `nit`;
- `where`: `path:line`;
- `defect` (one sentence) and `scenario` (concrete input or state, then wrong behaviour);
- `fix` and `test` (the check that would catch it first; empty for a nit).

A suspicion without a scenario is dropped. A broken repo rule counts. A call only the human can make becomes a question, never a finding.

## 3. Build the review page

Write `data.json` in a scratch folder, then run `node <skill dir>/build.mjs <data.json>`. It stores `reviews/<owner>-<repo>-pr-<n>.{json,html}` inside the skill folder (git-ignored there, so nothing lands in any project repo) and, when `$ORCA_CHAT_SCRATCH_DIR` is set (Orca), copies the page there for inline display. Elsewhere, write `data.json` to any temp folder. `pr.url` is required: the file name and the cleanup both derive from it. The page is a fixed template: never write the HTML.

```json
{
  "pr": {"title": "", "url": "", "head": "", "base": "", "size": ""},
  "problem": "What this PR solves, 1-2 sentences.",
  "how": "How it solves it, 2-3 sentences.",
  "verified": "Ran: ... Read only: ...",
  "repo": "absolute repo path",
  "commands": "the repo's verify commands",
  "findings": [{"id": "F1", "sev": "", "where": "", "defect": "", "scenario": "", "fix": "", "test": ""}],
  "questions": [{"id": "Q1", "text": ""}]
}
```

The page gives the human Approve / Dismiss per finding, a comment box per finding and per question, and a live implementor prompt built from the approved findings with the human's comments attached. The agent does not write that prompt.

## 4. Hand off

Show the page with `::orca-visual{file="<slug>.html" title="Review PR <n>"}` on its own line when `$ORCA_CHAT_SCRATCH_DIR` is set (`<slug>` is what build.mjs prints). Then one line each for the top two or three findings. Make no verdict: no "approve", "LGTM", or "changes requested". Make sure the review server is up (`curl -s -m 2 http://<host>:8765/` answers; otherwise start `node <skill dir>/serve.mjs` in the background and read the address it prints) and give `http://<host>:8765/<slug>.html`. The server lists every stored review at `/`, binds the Tailscale IP only (127.0.0.1 without Tailscale), and stays up until the human asks to stop it. A shareable link beyond the tailnet means a Claude Docs copy, and only when asked.

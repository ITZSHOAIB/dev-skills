# PR mode

Someone else's PR. The human hands the approved findings back to its implementor through the prompt on the page. Cost discipline: one diff read, a few targeted reads, one small JSON file.

## Gather

- First run `node <skill dir>/clean.mjs`: it deletes stored reviews of merged PRs and of local branches that no longer exist (`--closed` also removes closed PRs).
- `gh pr view <pr> --json title,body,url,headRefName,headRefOid,baseRefName,files,additions,deletions,reviews,comments` and `gh pr diff <pr>`, once each.
- `gh api repos/<owner>/<repo>/pulls/<n>/comments` once, for line comments from earlier reviews. The `history` lens uses them.
- `gh pr checks <pr>` once, for `ci`. A failing check becomes a finding only with a scenario that ties it to this diff; otherwise it stays in `ci.note`.
- Linked issues: `gh issue view <n> --json title,body` for each issue the body closes or references, at most three.
- Test in a throwaway **worktree**, so the human's checkout is untouched. In the human's clone of the repo (the current directory when it is one; otherwise `gh repo clone <owner>/<repo> <scratch>/<repo> -- --filter=blob:none`):

  ```sh
  git fetch origin +pull/<n>/head:guided-review/pr-<n>
  git worktree add <scratch>/pr-<n> guided-review/pr-<n>
  ```

  Install with the repo's lockfile command if the tests need it, then run the narrowest test command from `AGENTS.md` or `package.json` there. Lenses read code from this worktree.

Done when each changed file is read, the PR body's test claims are checked against the one command run, and, where the body has them, its other claims are checked against the diff: the Summary shape, Special things to note, and Merge Danger (door and blast radius).

## Claims

A claim the diff contradicts, with a scenario, is a finding; a claim too vague to check is a question. What Special things to note lists as deliberately left out is not a defect.

Each acceptance item of an issue the PR closes is also a claim, and must hold at the PR head. A missing item is a finding when it has a scenario, and a question otherwise.

`claims` has one entry per claim the PR body makes, in this order: Tests, Summary, Special things to note, Merge Danger. Leave out sections the body does not have. Linked-issue items come last, one entry each: `claim` is just `#<issue>` (it renders unwrapped) and `note` is the item plus where it holds, e.g. `docs page updated: website/artifacts.md (this PR)`. Record every claim you checked, so the page shows the check ran even when everything matches.

## Hand off

1. Remove the worktree, one command at a time so a failure skips nothing: `git worktree remove --force <scratch>/pr-<n>`; `rm -rf <scratch>/pr-<n>` if the folder is still there (installed dependencies can hold it); `git worktree prune`; `git branch -D guided-review/pr-<n>`.
2. When `$ORCA_CHAT_SCRATCH_DIR` is set, show the page with `::orca-visual{file="<slug>.html" title="Review PR <n>"}` on its own line.
3. Make sure the review server is up: `curl -s -m 2 http://<host>:8765/` answers; otherwise start `node <skill dir>/serve.mjs` in the background and read the address it prints. Give `http://<host>:8765/<slug>.html`. The server lists every stored review at `/`, binds the Tailscale IP only (127.0.0.1 without Tailscale), and stays up until the human asks to stop it.
4. One line each for the top two or three findings, and one line naming the lenses that ran.

The human copies the prompt from the page to the implementor, and posts to the PR themselves if they want to. A shareable link beyond the tailnet means a Claude Docs copy, and only when asked.

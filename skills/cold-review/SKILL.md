---
name: cold-review
disable-model-invocation: true
description: Review a code change with a zero-context cold read, standards and spec checks, and a human-approved fix loop.
---

Three-axis review of a code change: **Standards** and **Spec** come from the `code-review` skill when available, and **Cold read** comes from a goldfish: a fresh subagent that sees the code and nothing about why it was written. You are the elephant: you hold the context, triage findings, and apply only what the user approves.

Arguments: a fixed point (commit, branch, tag, `main`), optionally a spec path. Ask for the fixed point if it is missing.

## 1. Pin the change

Resolve the fixed point with `git rev-parse` and compute `BASE=$(git merge-base <fixed-point> HEAD)`. Confirm `git diff $BASE` is non-empty.

Run `git status --short`. If there is uncommitted work, tell the user the Standards and Spec axes will miss it, because they only read commits, while the cold read includes it. Ask whether to commit first or continue. If `git log $BASE..HEAD` is empty, those axes have nothing to read: continuing means skipping step 4 and reporting Standards and Spec as not run.

Done when `BASE` is known and the user has settled any uncommitted work.

## 2. Run the tight checks

Run the repo's type check and the tests covering the changed files. On a failure, show the output and ask whether to continue.

Done when the checks are green or the user has chosen to continue.

## 3. Send the goldfish

Spawn one `general-purpose` subagent. Send the template below verbatim, changing only `<BASE>`. The goldfish is only useful while sterile, so the prompt carries no spec, issue, commit message, branch name, or summary of the conversation.

```text
You are reviewing a code change cold. You know software but not this project.
Stay read-only.

Your sources are `git diff <BASE>`, the files it touches, and the code they
import or are imported by. Judge the code from those alone. Intent recorded
elsewhere (commit history, specs, design docs, issues) stays closed until you
finish, because the point of this review is what the code says by itself.

Report under these headings, under 400 words:

## What this change does
Your paraphrase in 3-6 sentences, written before any judgement.

## What it assumes
Each assumption the code relies on but does not state or enforce, with file:line.

## What surprised you
Anything a new maintainer would misread: names that mislead, behaviour you
could only explain by guessing, branches with no visible reason. Give file:line,
Severity (Blocker | Major | Nit), and your best guess at the reason.
```

Done when the report has all three headings. Keep it unedited for step 5.

## 4. Run the two-axis review

Do this after step 3, so nothing from it can reach the goldfish.

If the `code-review` skill is available, invoke it with the fixed point and spec path.

If it is missing, ask the user once whether to install it, and wait for the answer:

```sh
npx skills add mattpocock/skills --skill code-review -g
```

- **Yes**: run the command. If the skill can be invoked in this session, invoke it. Otherwise tell the user it arrives in their next session, and use the fallback for this run.
- **No**: follow [the fallback review](FALLBACK-REVIEW.md).

Done when you have `## Standards` and `## Spec` reports, and the report says which review produced them.

## 5. Check the paraphrase and triage

Compare the goldfish's paraphrase with the spec, or with the intent you hold if there is no spec. Each mismatch is a **paraphrase gap**: the code says something other than what was meant. A gap is a finding even when the behaviour is correct, because the fix may be a better name or a clearer structure.

Give every finding from all three axes one verdict:

- **Fix**: a real problem, with the proposed change.
- **Keep**: deliberate. State the reason. A reason only you know is itself a signal: name it as a candidate comment or test.
- **Verify**: a claim you have not confirmed. Check it against the code or by running it, then re-mark it Fix or Keep.

Present the three axes under separate `## Standards`, `## Spec`, and `## Cold read` headings, unranked across axes, so one axis cannot mask another. End with the worst issue per axis.

Done when every finding has a Fix or Keep verdict. Then stop and wait: the user chooses which fixes to apply.

## 6. Loop

Apply the approved fixes and re-run the tight checks. Then repeat step 3 with a brand-new goldfish, keeping the same `BASE`. Triage its report as in step 5.

Stop when a round has no new Blocker or Major finding, or after 3 rounds, whichever comes first. If findings remain at round 3, report them as open. A goldfish that keeps raising the same point usually means the code needs a comment or a test rather than another fix.

Standards and Spec run once. If the fixes were large, suggest the user commit and repeat step 4.

Done when you have reported the final state: fixes applied, findings kept with reasons, and findings left open.

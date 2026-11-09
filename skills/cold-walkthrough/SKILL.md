---
name: cold-walkthrough
disable-model-invocation: true
description: Test a product end to end by having fresh subagents install and use it from only its public materials, timing each one, then fix the real gaps. Use for "walk through the quickstart", "can a new user get this working", "can a coding agent build with it from the docs URL".
---

Find where a newcomer gets stuck actually using a product. Each tester is a goldfish: a fresh subagent that has only the product's public materials and a shell. You are the elephant: you hold the context, check each report against the source, and fix only what is real.

This runs real commands, so it costs more than `cold-docs`, which only reads. Use `cold-docs` for a docs-only change. Use this before a release or after a change to install, scaffolding, the CLI, or error messages.

Arguments: the product and its public entry point (a docs URL, an npm package, a repo), and optionally a persona. Ask if the entry point is missing. Personas:

- **Developer**: a person who follows the quickstart.
- **Coding agent**: a person asks their coding agent to build something with the product and gives it only the URL. This tests whether the docs and scaffold work as instructions for an agent.

## 1. Pin the target

Write down the entry point, the persona, and one concrete outcome to reach ("the quickstart's agent runs and passes its checks", "build a refund agent with an approval step"). Confirm the outcome is reachable with no secrets. If it needs a paid key or account, pick an outcome short of that, and say what the walkthrough will not cover.

Find out which version the tester will get (`npm view <package> version`, the release tag) and which version the docs describe. Docs deployed ahead of a release make every tester fail on features that exist only on the main branch. If the two differ, say so now: test the published version, and expect those failures to be reported as one finding, "docs are ahead of the release", not as separate bugs.

Done when the entry point, persona, outcome, exclusions, and versions are written down.

## 2. Send the testers

Spawn 2 fresh `general-purpose` subagents in parallel, one per persona if you are testing both, otherwise two on the same persona with different tasks. Use the template below, filling only `<ENTRY>`, `<PERSONA>`, `<OUTCOME>`, `<DIR>`, `<SHELL>`, and `<OS>`. The prompt carries no repository access, no conversation history, and no hint about known problems.

Give each tester its own empty directory outside the product's repository, so the product's source and instruction files cannot leak in.

```text
You are <PERSONA>. Your goal: <OUTCOME>.
Your only source is <ENTRY> and what it links to, plus the published package
and its own --help output. Do not read the product's source repository, and do
not look anything up outside those. Work only inside <DIR>. Your shell is <SHELL> on <OS>; if a command in the docs does not run there, say so and name the equivalent you used.

Never ask for, create, or paste secrets or API keys. If a step needs one, stop
and report that step.

Do the task as a newcomer would. Time yourself: note the minutes at the start,
at each major step, and at the end. When something fails, say what you tried
before you worked around it.

Report under these headings, under 600 words:

## Result
Did you reach the goal? Total minutes. The exact commands you ran, in order. The version of each package you installed.

## Stumbles
Each as: step, what you expected, what happened (paste the error or output),
how you got past it, and the minutes it cost. Mark each Blocker, Major, or Nit.

## What the docs got wrong
Anything a page said that was false, missing, or out of date when you ran it.

## What I would change
The smallest fixes that would have saved you the most time.
```

Done when both reports have all four headings. Keep them unedited for step 3.

## 3. Verify every claim

Testers report what they saw, and sometimes what they imagined. For each stumble and each "docs got wrong", reproduce or check it against the source:

- **Real**: confirmed. Note the fix.
- **Not real**: the product behaves as documented, or the tester misread or invented it. Quote the evidence.
- **Tester error**: real behaviour, but caused by the tester's own mistake and not by missing guidance. Keep it only if a better message would have prevented it.
- **Deferred**: real, but a decision for the user, such as a new public command or schema.
- **Fixed on main, not released**: real for the published version, already fixed in the source. Not a code change; the finding is the release gap. Group these into one.

Two testers hitting the same problem independently is strong evidence. A step one tester skipped without trouble is not a finding.

Present the findings by verdict, with the minutes each real one cost. Done when every finding has a verdict. Then stop and wait: the user chooses which fixes to apply and which deferred items to take.

## 4. Fix, release, and re-test

Group the approved fixes into one change, following the repo's rules for docs, tests, and changesets. Fixes to published packages reach testers only after a release, so say so, and re-test against the published version or a local build, whichever the persona would use.

Re-run step 2 with brand-new testers on the same outcome. Stop when a round reaches the goal with no new Blocker or Major stumble, or after 3 rounds. Compare the total minutes with the first round.

## 5. Clean up and report

Delete the testers' directories. Report the minutes before and after, what changed, what was deferred, and a copyable prompt for an implementing agent:

```text
In <repo>, fix these gaps found by a cold walkthrough, in one change: <list of
Real findings, each with step, problem, and fix>. Do not change anything else.
Follow the repo's docs and changeset rules, run its checks, and open one PR.
```

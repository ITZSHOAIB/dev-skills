---
name: cold-docs
disable-model-invocation: true
description: Audit documentation by having fresh subagents read it as newcomers with no context, then verify each gap against the source and fix the real ones. Use for "audit the docs", "can a new user follow the quickstart", "are these docs clear".
---

Find where documentation fails a reader who knows nothing about the project. Each reader is a goldfish: a fresh, read-only subagent that sees the docs and nothing about why they were written. You are the elephant: you hold the context, check each claim against the source, and fix only what is real.

Reading catches what is unclear, missing, or contradictory. It does not catch commands that fail when run. For that, use `cold-walkthrough`.

Arguments: the docs to audit (a folder, a URL, or a list of pages) and optionally a persona. Ask for the docs if they are missing. The default persona is a developer who has just heard of the project and wants to use it.

## 1. Pin the target

List the pages in scope and, for each, how a goldfish reads it: a file path, or a public URL. If the docs are published, prefer the published copy, because that is what a real reader sees. Pick the persona and the one task they came to do ("get the quickstart working", "add a tool", "deploy it").

Tell the goldfish to fetch each page as raw text (`curl`, or a request for Markdown) and not through a summarising web tool, which drops code samples and exact wording. A goldfish that could only read summaries says so in its report; treat its gaps as unconfirmed.

Done when the page list, the persona, the task, and how pages are fetched are written down.

## 2. Send the goldfish

Spawn 2 fresh `general-purpose` subagents in parallel, each with a different starting page, so they do not follow the same path. Use the template below, filling only `<PAGES>`, `<PERSONA>`, and `<TASK>`. The prompt carries no repository context, no summary of the conversation, and no hint about known problems, because a goldfish that has been told where to look finds only that.

```text
You are <PERSONA>. You are reading documentation to <TASK>.
Stay read-only: run no commands except fetching the pages as raw text, and do not open the project's source code.
Your only sources are these pages and the pages they link to: <PAGES>.

Read as a newcomer would: top to bottom, following links when you need them.
Write down every place you were unsure, stuck, or had to guess.

Report under these headings, under 500 words:

## What I understood
The project and the task in your own words, 3-5 sentences, before any judgement.

## Where I got stuck
Each gap as: page, the sentence or step, what was missing or confusing, and
what you would have done instead. Mark each Blocker (could not continue),
Major (continued by guessing), or Nit (slowed down).

## Contradictions
Two places that disagree, or a page that disagrees with itself. Quote both.

## Undefined terms
Words, flags, files, or concepts used before they are explained.

## How I read
How you fetched the pages, and whether you saw the full text or a summary.

## Could I finish?
Yes or no for the task, and the first step where you would have stopped.
```

Done when both reports have all six headings. Keep them unedited for step 3.

## 3. Verify each gap

A goldfish can be wrong, and an invented problem costs a fix. For every gap, contradiction, and term, check it against the source of truth: the code, the CLI help, the config schema, or the page itself. Give it one verdict:

- **Real**: the docs are wrong, missing, or unclear. Note the fix.
- **Not real**: the docs already say it, or the goldfish misread. Quote where, and note whether the page's wording made the misread likely. If it did, the gap is real but smaller.
- **Verify**: needs the product to be run. Hand these to `cold-walkthrough`, or run them yourself.

Group Real findings by page. Two goldfish raising the same point independently is strong evidence; weigh it above a single mention.

Present the findings under `## Real`, `## Not real`, and `## Verify`, with the worst gap per page. Done when every finding has a verdict. Then stop and wait: the user chooses which fixes to apply.

## 4. Fix and re-read

Apply the approved fixes, grouped into one change. Where the project requires docs and README updates alongside code, follow that rule. Then repeat step 2 with a brand-new goldfish on the changed pages only, with a different starting page.

Stop when a round has no new Blocker or Major gap, or after 3 rounds, whichever comes first. A goldfish that keeps raising the same point usually means the page needs restructuring rather than another sentence.

## 5. Report

End with what changed, what was kept and why, what is still open, and a copyable prompt the user can hand to an implementing agent:

```text
In <repo>, fix these documentation gaps in one change: <list of Real findings,
each with page, problem, and the fix>. Do not change anything else. Follow the
repo's docs and changeset rules, run its checks, and open one PR.
```

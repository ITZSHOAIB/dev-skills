# Fallback review

Standards and Spec reviews for when the `code-review` skill is unavailable. Spawn both subagents together as fresh `general-purpose` agents, and report their output under `## Standards` and `## Spec`, unmerged. Note in the report that the fallback ran.

## Standards

Find the files that document how code should be written here: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, and anything they point to. Fill in both placeholders.

```text
Review `git diff <BASE>...HEAD` against this repo's documented standards.
Stay read-only.

Standards files: <paths>

Report every place the diff breaks a documented rule, citing file and rule.
Separately, list maintainability concerns the documents do not cover, such as
misleading names, duplicated logic, or abstraction with no current use. Mark
these as judgement calls. A documented rule beats your own preference. Skip
anything a linter or formatter already enforces. Under 400 words.
```

If the repo documents no standards, send the prompt with `Standards files: none`, and every finding is a judgement call.

## Spec

Use the spec path from the arguments. Without one, look for a spec under `docs/` or `specs/` matching the branch or feature, then ask the user. If there is no spec, skip this agent and report `no spec available`.

```text
Compare `git diff <BASE>...HEAD` with the spec at <path>. Stay read-only.

Report:
(a) requirements that are missing or partial,
(b) behaviour nobody asked for,
(c) requirements that look implemented but wrong.

Quote the spec line for each finding. Under 400 words.
```

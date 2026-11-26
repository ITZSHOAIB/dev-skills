---
name: cold-review
disable-model-invocation: true
description: Moved into guided-review. /cold-review <ref> now runs /guided-review <ref> in self mode.
---

# Cold review

Cold review is now the self mode of `guided-review`: the same cold read, Standards check, and human-approved fix loop, with the guided-review page for decisions.

Find `guided-review/SKILL.md` beside this skill's folder, read it, and follow it with the same arguments. A git ref selects self mode.

If it is not installed, tell the human to run `npx skills add ITZSHOAIB/dev-skills --skill guided-review -g` and start a new session, and stop.

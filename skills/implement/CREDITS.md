# Credits

This skill is a fork of [Matt Pocock](https://github.com/mattpocock)'s [`implement`](https://github.com/mattpocock/skills/tree/main/skills/engineering/implement) skill (MIT), forked from `mattpocock-skills` as installed on 2026-10-06; re-diff against upstream when the plugin updates. The TDD, typecheck, test, and `/code-review` steps are his.

The fork adds a work branch based on a fresh default branch, a verify step that runs every CI check locally, `/code-review` pinned to the base branch, and a draft PR written with the [`pr`](../pr/SKILL.md) skill, followed by a CI watch. The draft PR follows his [`implement-spec`](https://github.com/mattpocock/skills/tree/main/skills/engineering/implement-spec) skill, which already opens one for a whole spec. The draft is meant for [`guided-review`](../guided-review/SKILL.md).

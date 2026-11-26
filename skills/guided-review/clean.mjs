// Usage: node clean.mjs [--closed] [--dry]
// Deletes stored reviews whose PR is merged (--closed also removes closed PRs),
// and self-mode reviews whose branch or repo folder no longer exists.
// Open PRs and PRs that cannot be looked up are kept. Also removes the inline copy in $ORCA_CHAT_SCRATCH_DIR.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const flags = new Set(process.argv.slice(2));
const reviews = join(dirname(fileURLToPath(import.meta.url)), "reviews");
if (!existsSync(reviews)) process.exit(0);
const scratch = process.env.ORCA_CHAT_SCRATCH_DIR;

function localState({ repo, pr }) {
  if (!existsSync(repo)) return "GONE";
  try {
    execFileSync("git", ["-C", repo, "rev-parse", "--verify", "--quiet", `${pr.head}^{commit}`], { stdio: "ignore" });
    return "OPEN";
  } catch {
    return "GONE";
  }
}

for (const file of readdirSync(reviews).filter((name) => name.endsWith(".json"))) {
  const slug = file.slice(0, -".json".length);
  let state;
  try {
    const review = JSON.parse(readFileSync(join(reviews, file), "utf8"));
    state = review.mode === "self"
      ? localState(review)
      : execFileSync("gh", ["pr", "view", review.pr.url, "--json", "state", "-q", ".state"], { encoding: "utf8" }).trim();
  } catch {
    continue;
  }
  if (state !== "MERGED" && state !== "GONE" && !(flags.has("--closed") && state === "CLOSED")) continue;
  for (const path of [join(reviews, file), join(reviews, `${slug}.html`), scratch && join(scratch, `${slug}.html`)]) {
    if (!path || !existsSync(path)) continue;
    if (!flags.has("--dry")) rmSync(path);
    console.log(`${flags.has("--dry") ? "would remove" : "removed"} ${path} (${state})`);
  }
}

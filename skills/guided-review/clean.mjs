// Usage: node clean.mjs [--closed] [--dry]
// Deletes stored reviews whose PR is merged; --closed also removes closed PRs.
// Open PRs and PRs that cannot be looked up are kept. Also removes the inline copy in $ORCA_CHAT_SCRATCH_DIR.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const flags = new Set(process.argv.slice(2));
const reviews = join(dirname(fileURLToPath(import.meta.url)), "reviews");
if (!existsSync(reviews)) process.exit(0);
const scratch = process.env.ORCA_CHAT_SCRATCH_DIR;

for (const file of readdirSync(reviews).filter((name) => name.endsWith(".json"))) {
  const slug = file.slice(0, -".json".length);
  let state;
  try {
    const { pr } = JSON.parse(readFileSync(join(reviews, file), "utf8"));
    state = execFileSync("gh", ["pr", "view", pr.url, "--json", "state", "-q", ".state"], { encoding: "utf8" }).trim();
  } catch {
    continue;
  }
  if (state !== "MERGED" && !(flags.has("--closed") && state === "CLOSED")) continue;
  for (const path of [join(reviews, file), join(reviews, `${slug}.html`), scratch && join(scratch, `${slug}.html`)]) {
    if (!path || !existsSync(path)) continue;
    if (!flags.has("--dry")) rmSync(path);
    console.log(`${flags.has("--dry") ? "would remove" : "removed"} ${path} (${state})`);
  }
}

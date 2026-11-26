// Usage: node build.mjs <data.json>
// Stores the review as reviews/<slug>.{json,html} inside this skill folder,
// and copies the page to $ORCA_CHAT_SCRATCH_DIR so Orca can show it inline.
// Slug: <owner>-<repo>-pr-<n> for a PR, local-<repo>-<branch> for self mode.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = dirname(fileURLToPath(import.meta.url));
const [dataPath] = process.argv.slice(2);
if (!dataPath) throw new Error("usage: node build.mjs <data.json>");

const review = JSON.parse(readFileSync(dataPath, "utf8"));
for (const key of ["repo", "commands"]) if (!review[key]) throw new Error(`${key} is required`);
const match = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(review.pr?.url ?? "");
let slug;
if (match) slug = `${match[1]}-${match[2]}-pr-${match[3]}`;
else if (review.mode === "self" && review.pr?.head) slug = `local-${basename(review.repo)}-${review.pr.head}`;
else throw new Error("pr.url must be a GitHub pull request URL, or set mode to self with pr.head");
slug = slug.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");

// GitHub's files tab anchors each file at #diff-<sha256(path)>, and a line at R<line>.
const fileLink = (where) => {
  const [, path, line] = /^(.+?)(?::(\d+))?$/.exec(where ?? "") ?? [];
  if (!match || !path) return "";
  return `${review.pr.url}/files#diff-${createHash("sha256").update(path).digest("hex")}${line ? `R${line}` : ""}`;
};
for (const finding of review.findings ?? []) finding.href = fileLink(finding.where);
for (const file of review.reading ?? []) file.href = fileLink(file.path);

const reviews = join(skillDir, "reviews");
mkdirSync(reviews, { recursive: true });
review.builtAt = new Date().toISOString();
const json = JSON.stringify(review);
const template = readFileSync(join(skillDir, "template.html"), "utf8");
writeFileSync(join(reviews, `${slug}.json`), json);
writeFileSync(join(reviews, `${slug}.html`), template.replace("__DATA__", () => json.replaceAll("<", "\\u003c")));

const scratch = process.env.ORCA_CHAT_SCRATCH_DIR;
if (scratch) copyFileSync(join(reviews, `${slug}.html`), join(scratch, `${slug}.html`));
console.log(slug);

// Usage: node build.mjs <data.json>
// Stores the review as reviews/<owner>-<repo>-pr-<n>.{json,html} inside this skill folder,
// and copies the page to $ORCA_CHAT_SCRATCH_DIR so Orca can show it inline.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = dirname(fileURLToPath(import.meta.url));
const [dataPath] = process.argv.slice(2);
if (!dataPath) throw new Error("usage: node build.mjs <data.json>");

const review = JSON.parse(readFileSync(dataPath, "utf8"));
const match = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(review.pr?.url ?? "");
if (!match) throw new Error("pr.url must be a GitHub pull request URL");
const slug = `${match[1]}-${match[2]}-pr-${match[3]}`.toLowerCase();

const reviews = join(skillDir, "reviews");
mkdirSync(reviews, { recursive: true });
const json = JSON.stringify(review);
const template = readFileSync(join(skillDir, "template.html"), "utf8");
writeFileSync(join(reviews, `${slug}.json`), json);
writeFileSync(join(reviews, `${slug}.html`), template.replace("__DATA__", () => json.replaceAll("<", "\\u003c")));

const scratch = process.env.ORCA_CHAT_SCRATCH_DIR;
if (scratch) copyFileSync(join(reviews, `${slug}.html`), join(scratch, `${slug}.html`));
console.log(slug);

// Usage: node serve.mjs [port=8765]
// Serves reviews/ read-only: an index of all stored reviews at /, each page at /<slug>.html.
// Binds the Tailscale IPv4 address (tailnet only); falls back to 127.0.0.1 without Tailscale.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const reviews = join(dirname(fileURLToPath(import.meta.url)), "reviews");
const port = Number(process.argv[2] ?? 8765);
const escape = (text) => String(text).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function host() {
  try {
    return execFileSync("tailscale", ["ip", "-4"], { encoding: "utf8" }).trim().split(/\r?\n/)[0];
  } catch {
    return "127.0.0.1";
  }
}

function index() {
  const rows = existsSync(reviews)
    ? readdirSync(reviews)
        .filter((name) => name.endsWith(".json"))
        .map((name) => ({ name, mtime: statSync(join(reviews, name)).mtimeMs, ...JSON.parse(readFileSync(join(reviews, name), "utf8")) }))
        .sort((a, b) => b.mtime - a.mtime)
        .map((r) => {
          const slug = r.name.slice(0, -".json".length);
          const sev = (s) => r.findings.filter((f) => f.sev === s).length;
          return `<li><a href="/${slug}.html">${escape(r.pr.title)}</a><br><small>${escape(slug)} · ${r.findings.length} findings (${sev("blocking")} blocking, ${sev("should-fix")} should-fix, ${sev("nit")} nit) · ${new Date(r.mtime).toLocaleString()}</small></li>`;
        })
    : [];
  return `<!doctype html><meta charset="utf-8"><title>Guided reviews</title><style>:root{color-scheme:light dark}body{font:14px/1.6 system-ui;max-width:760px;margin:16px auto;padding:0 12px}li{margin:10px 0}small{opacity:.6}</style><h1>Guided reviews</h1><ul>${rows.join("") || "<li>No reviews yet.</li>"}</ul>`;
}

createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let body;
  try {
    const file = /^\/([\w.-]+\.html)$/.exec(path)?.[1];
    body = path === "/" ? index() : file ? readFileSync(join(reviews, file)) : undefined;
  } catch {}
  if (body === undefined) return void res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(body);
}).listen(port, host(), () => console.log(`http://${host()}:${port}/`));

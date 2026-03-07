#!/usr/bin/env node

// Save a bookmark to bookmarks.json in the GitHub repo via the Contents API.
//
// Usage (CLI args):
//   node scripts/save-bookmark.mjs \
//     --url "https://example.com" \
//     --title "Example" \
//     --description "A description" \
//     --tags "tech,apps"
//
// Usage (JSON on stdin):
//   echo '{"url":"https://example.com","title":"Example","tags":"tech,apps"}' \
//     | node scripts/save-bookmark.mjs --stdin
//
// Environment variables:
//   GITHUB_TOKEN (required) — fine-grained PAT with contents:write on snptrs/marx

const REPO = "snptrs/marx";
const FILE_PATH = "src/_data/bookmarks.json";
const API_BASE = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

// --- Helpers ---

function die(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--stdin") {
      args.stdin = true;
    } else if (arg.startsWith("--") && i + 1 < argv.length) {
      args[arg.slice(2)] = argv[++i];
    }
  }
  return args;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => t.trim()).filter(Boolean);
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function githubFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res;
}

// --- Main ---

async function main() {
  // 1. Collect input
  const cliArgs = parseArgs(process.argv);
  let input;

  if (cliArgs.stdin) {
    const raw = await readStdin();
    try {
      input = JSON.parse(raw);
    } catch {
      die("Invalid JSON on stdin");
    }
  } else {
    input = cliArgs;
  }

  const url = (input.url || "").trim();
  const title = (input.title || "").trim();
  const description = (input.description || "").trim();
  const tags = parseTags(input.tags);

  // 2. Validate input
  if (!process.env.GITHUB_TOKEN)
    die("GITHUB_TOKEN environment variable is not set");
  if (!process.env.COMMITTER_NAME)
    die("COMMITTER_NAME environment variable is not set");
  if (!process.env.COMMITTER_EMAIL)
    die("COMMITTER_EMAIL environment variable is not set");
  if (!url) die("url is required");
  if (!title) die("title is required");

  try {
    new URL(url);
  } catch {
    die(`Invalid URL: ${url}`);
  }

  // 3. Fetch current file from GitHub
  const getRes = await githubFetch(API_BASE);
  if (!getRes.ok) {
    die(`Failed to fetch bookmarks from GitHub: ${getRes.status}`);
  }

  const fileData = await getRes.json();
  const sha = fileData.sha;
  if (!sha) die("No SHA returned from GitHub");

  // 4. Decode and parse existing bookmarks
  const decoded = Buffer.from(fileData.content, "base64").toString("utf8");
  let bookmarks;
  try {
    bookmarks = JSON.parse(decoded);
  } catch {
    die("Existing bookmarks.json is not valid JSON");
  }

  if (!Array.isArray(bookmarks)) {
    die("Existing bookmarks.json is not an array");
  }

  // 5. Check for duplicate URL
  if (bookmarks.some((b) => b.url === url)) {
    die("Bookmark already exists for this URL");
  }

  const countBefore = bookmarks.length;

  // 6. Append new bookmark
  bookmarks.push({
    url,
    title,
    description,
    tags,
    saved: new Date().toISOString(),
  });

  // 7. Serialize
  const serialized = JSON.stringify(bookmarks, null, 2) + "\n";

  // 8. Re-parse and validate output
  let reparsed;
  try {
    reparsed = JSON.parse(serialized);
  } catch {
    die("Serialized bookmarks failed to re-parse as JSON");
  }

  if (!Array.isArray(reparsed)) {
    die("Serialized bookmarks is not an array");
  }

  if (reparsed.length !== countBefore + 1) {
    die(`Expected ${countBefore + 1} bookmarks, got ${reparsed.length}`);
  }

  const lastEntry = reparsed[reparsed.length - 1];
  if (lastEntry.url !== url) {
    die("New bookmark URL not found at end of array");
  }

  // 9. Upload to GitHub
  const encoded = Buffer.from(serialized).toString("base64");

  const putRes = await githubFetch(API_BASE, {
    method: "PUT",
    body: JSON.stringify({
      message: `Add bookmark: ${title}`,
      committer: {
        name: process.env.COMMITTER_NAME,
        email: process.env.COMMITTER_EMAIL,
      },
      content: encoded,
      sha,
    }),
  });

  if (putRes.ok) {
    console.log("OK");
  } else if (putRes.status === 409) {
    die("Conflict — bookmarks.json was modified by someone else. Try again.");
  } else {
    die(`GitHub API returned ${putRes.status}`);
  }
}

main().catch((err) => die(err.message));

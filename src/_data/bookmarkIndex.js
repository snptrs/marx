import allBookmarks from "./bookmarks.json" with { type: "json" };

function isExpired(bookmark, now = Date.now()) {
  if (!bookmark.expires) return false;
  const expiresAt = Date.parse(bookmark.expires);
  return Number.isFinite(expiresAt) && expiresAt <= now;
}

export default function () {
  // Filter out expired bookmarks, then sort newest first
  const bookmarks = allBookmarks
    .filter((bookmark) => !isExpired(bookmark))
    .sort((a, b) => new Date(b.saved) - new Date(a.saved));

  // Group by tag (case-insensitive)
  const tagMap = new Map();

  for (const bookmark of bookmarks) {
    for (const tag of bookmark.tags || []) {
      const slug = tag
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (!tagMap.has(slug)) {
        tagMap.set(slug, { name: tag, slug, bookmarks: [] });
      }

      tagMap.get(slug).bookmarks.push(bookmark);
    }
  }

  // Sort tags alphabetically
  const tags = [...tagMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  // Group tags by first letter for sidebar display
  const tagsByLetter = {};
  for (const tag of tags) {
    const letter = tag.name.charAt(0).toUpperCase();
    if (!tagsByLetter[letter]) {
      tagsByLetter[letter] = [];
    }
    tagsByLetter[letter].push(tag);
  }

  const tagGroups = Object.keys(tagsByLetter)
    .sort()
    .map((letter) => ({ letter, tags: tagsByLetter[letter] }));

  return { bookmarks, tags, tagGroups };
}

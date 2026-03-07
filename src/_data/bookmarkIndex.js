import bookmarks from "./bookmarks.json" with { type: "json" };

export default function () {
  // Sort bookmarks newest first
  bookmarks.sort((a, b) => new Date(b.saved) - new Date(a.saved));

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

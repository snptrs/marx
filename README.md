# Marx

A personal bookmarks site built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

🔗 **Live site:** [snptrs.github.io/marx](https://snptrs.github.io/marx)

## Features

- Bookmark collection with tagging and search ([Pagefind](https://pagefind.app/))
- Tag-based browsing and filtering
- Styled with [Tailwind CSS v4](https://tailwindcss.com/)
- [Vento](https://vento.js.org/) templates

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+

### Install dependencies

```sh
npm install
```

### Development

Start a local dev server with live reload:

```sh
npm run serve
```

### Build

Generate the production site into `_site/`:

```sh
npm run build
```

## Adding bookmarks

Add entries to `src/_data/bookmarks.json`:

```json
{
  "url": "https://example.com",
  "title": "Example Site",
  "description": "An optional description (just omit the field if not needed)",
  "tags": ["tag-name", "second-tag"],
  "saved": "2025-01-01T12:00:00Z"
}
```

## Tags JSON endpoint

A list of all tags is available at `/tags.json`, generated from `src/tags.json.vto`. Each entry includes the tag `name` and `slug`.

## Project structure

```
src/
├── _data/            # Bookmark data and site metadata
├── _includes/        # Layouts and partials (Vento templates)
├── assets/           # CSS and fonts
├── index.vto         # Homepage
├── search.vto        # Search page
└── tags.vto          # Tag listing page
```

## Deployment

The site is automatically built and deployed to GitHub Pages via a [GitHub Actions workflow](.github/workflows/deploy-pages.yml) on every push to `main`.

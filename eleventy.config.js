import { HtmlBasePlugin } from "@11ty/eleventy";
import fontAwesomePlugin from "@11ty/font-awesome";
import tailwindcss from "@tailwindcss/postcss";
import { execSync } from "child_process";
import cssnano from "cssnano";
import { VentoPlugin } from "eleventy-plugin-vento";
import fs from "fs";
import path from "path";
import postcss from "postcss";

export default function (eleventyConfig) {
  eleventyConfig.addFilter("capitalize", (value) => {
    if (typeof value !== "string" || value.length === 0) {
      return value;
    }

    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
  });

  eleventyConfig.addFilter("date", (value, format) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date passed to date filter: "${value}"`);
    }

    const replacements = {
      "%-d": String(date.getUTCDate()),
      "%b": date.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      }),
      "%Y": String(date.getUTCFullYear()),
    };

    return format.replace(/%-d|%b|%Y/g, (token) => replacements[token]);
  });

  eleventyConfig.addPlugin(fontAwesomePlugin, {
    defaultAttributes: {
      width: "1.25em",
      height: "1.25em",
    },
  });

  const processor = postcss([tailwindcss(), cssnano({ preset: "default" })]);

  eleventyConfig.on("eleventy.before", async () => {
    const tailwindInputPath = path.resolve("./src/assets/styles/index.css");
    const tailwindOutputPath = "./_site/assets/styles/index.css";

    const cssContent = fs.readFileSync(tailwindInputPath, "utf8");

    const outputDir = path.dirname(tailwindOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const result = await processor.process(cssContent, {
      from: tailwindInputPath,
      to: tailwindOutputPath,
    });

    fs.writeFileSync(tailwindOutputPath, result.css);
  });

  eleventyConfig.on("eleventy.after", () => {
    execSync(`npx pagefind --site _site --glob "**/*.html"`, {
      encoding: "utf-8",
    });
  });

  // Tell the dev server to watch the compiled CSS and reload when it changes
  eleventyConfig.setServerOptions({
    watch: ["_site/assets/styles/**/*.css"],
  });

  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPlugin(VentoPlugin, {
    autotrim: true,
  });

  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/",
    htmlTemplateEngine: "vto",
    markdownTemplateEngine: "vto",
    dataTemplateEngine: "vto",
  };
}

export default function (eleventyConfig) {
  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.set({ typographer: true });
  });
}

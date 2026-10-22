import sharp from "sharp";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const sources = JSON.parse(
  readFileSync(".local/story-art-sources.json", "utf8"),
);
mkdirSync("public/images/story", { recursive: true });
const manifest = [];
for (const { id, source, prompt } of sources) {
  const output = `public/images/story/${id}.webp`;
  const info = await sharp(source)
    .resize({ width: 1536, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(output);
  manifest.push({
    id,
    path: output,
    width: info.width,
    height: info.height,
    bytes: info.size,
    prompt,
  });
}
writeFileSync(
  "docs/story-art-manifest.json",
  JSON.stringify(
    {
      generator: "Built-in image_gen",
      purpose:
        "Original fictional investigation scene artwork; no original game screenshots",
      assets: manifest,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Optimized ${manifest.length} original assets: ${Math.round(manifest.reduce((s, a) => s + a.bytes, 0) / 1024)} KiB total.`,
);

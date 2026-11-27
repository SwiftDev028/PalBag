import { readFile, writeFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configSandbox = { window: {} };
runInNewContext(await readFile(resolve(root, "js/seo-config.js"), "utf8"), configSandbox);
const config = configSandbox.window.PALBAG_SEO_CONFIG;
const siteUrl = new URL(config.siteUrl);

if (siteUrl.protocol !== "https:" || !siteUrl.pathname.endsWith("/")) {
  throw new Error("siteUrl must be an HTTPS URL ending in /.");
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function canonicalFor(file) {
  return file === "index.html" ? siteUrl.href : new URL(file, siteUrl).href;
}

function seoBlock(file, metadata) {
  const canonical = canonicalFor(file);
  const image = new URL(metadata.image, siteUrl).href;
  const robots = metadata.indexable ? "index,follow,max-image-preview:large" : "noindex,follow";
  const title = escapeAttribute(metadata.title);
  const description = escapeAttribute(metadata.description);

  return `<!-- PALBAG_SEO_START -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="PALBAG">
    <meta property="og:locale" content="ru_RU">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:alt" content="${title}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <!-- PALBAG_SEO_END -->`;
}

for (const [file, metadata] of Object.entries(config.pages)) {
  const filePath = resolve(root, file);
  let html = await readFile(filePath, "utf8");
  const block = seoBlock(file, metadata);
  const blockPattern = /<!-- PALBAG_SEO_START -->[\s\S]*?<!-- PALBAG_SEO_END -->/;

  if (blockPattern.test(html)) {
    html = html.replace(blockPattern, block);
  } else {
    html = html
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "")
      .replace(/<meta\s+name="description"[^>]*>/i, "")
      .replace(/(\s*<link rel="stylesheet")/i, `\n    ${block}$1`);
  }

  if (!html.includes('src="js/seo-config.js"')) {
    html = html.replace(
      '<script defer src="js/app.js"></script>',
      '<script defer src="js/seo-config.js"></script>\n    <script defer src="js/app.js"></script>'
    );
  }

  html = html.replace(/^[\t ]+$/gm, "");
  await writeFile(filePath, html);
}

const productsSandbox = { window: {} };
runInNewContext(await readFile(resolve(root, "js/products.js"), "utf8"), productsSandbox);
const products = productsSandbox.window.PALBAG_PRODUCTS;
const productIds = products.map((product) => product.id);
if (new Set(productIds).size !== productIds.length) {
  throw new Error("Product IDs must be unique to generate product sitemap URLs.");
}

const sitemapUrls = Object.entries(config.pages)
  .filter(([file, metadata]) => metadata.indexable && file !== "product.html")
  .map(([file]) => canonicalFor(file));

for (const id of productIds) {
  const url = new URL("product.html", siteUrl);
  url.searchParams.set("id", id);
  sitemapUrls.push(url.href);
}

const xmlEscape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join("\n")}
</urlset>
`;
const robots = `User-agent: *
Allow: /

Sitemap: ${new URL("sitemap.xml", siteUrl).href}
`;

await writeFile(resolve(root, "sitemap.xml"), sitemap);
await writeFile(resolve(root, "robots.txt"), robots);
console.log(`Generated SEO metadata for ${Object.keys(config.pages).length} pages and ${products.length} products at ${siteUrl.href}`);

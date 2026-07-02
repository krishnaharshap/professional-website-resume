// Generates the sanitized resume PDF from the site's print layout.
// Serves the repo over a throwaway local HTTP server (fetch of the JSON needs
// http, not file://), waits for hydration, prints with Chromium.
// Usage: npm run pdf
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://x").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const file = normalize(join(root, relative));
    if (!file.startsWith(normalize(root))) throw new Error("traversal");
    const body = await readFile(file);
    response.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#skills-body .skill-group");
  await page.emulateMedia({ media: "print" });
  const output = join(root, "assets", "Krishna_Puppala_Resume.pdf");
  await page.pdf({
    path: output,
    format: "Letter",
    printBackground: false,
    margin: { top: "14mm", bottom: "14mm", left: "14mm", right: "14mm" },
  });
  console.log("PDF written:", output);
} finally {
  await browser.close();
  server.close();
}

import { copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const targetDirectory = join(root, "dist", ".openai");

await mkdir(targetDirectory, { recursive: true });
await copyFile(
  join(root, ".openai", "hosting.json"),
  join(targetDirectory, "hosting.json"),
);
await copyFile(
  join(root, "app", "icon.svg"),
  join(root, "dist", "client", "icon.svg"),
);

const serverDirectory = join(root, "dist", "server");
const generatedEntry = join(serverDirectory, "index.js");
const { default: render } = await import(pathToFileURL(generatedEntry).href);
const pages = {};

for (const pathname of ["/", "/join"]) {
  const response = await render(
    new Request(`https://all-roads-to-lands.local${pathname}`),
    {},
    { waitUntil() {} },
  );
  if (!response.ok) {
    throw new Error(`Could not prerender ${pathname}: HTTP ${response.status}`);
  }
  pages[pathname] = await response.text();
}

await rename(
  generatedEntry,
  join(serverDirectory, "vinext-app.js"),
);
await writeFile(
  generatedEntry,
  `const pages = ${JSON.stringify(pages)};\n\nexport default {\n  fetch(request) {\n    const url = new URL(request.url);\n    const pathname = url.pathname === "/join/" ? "/join" : url.pathname;\n    const html = pages[pathname];\n    if (!html) {\n      return new Response("Not found", { status: 404 });\n    }\n    return new Response(request.method === "HEAD" ? null : html, {\n      status: 200,\n      headers: {\n        "content-type": "text/html; charset=utf-8",\n        "cache-control": "public, max-age=60, s-maxage=300",\n      },\n    });\n  },\n};\n`,
);

console.log("Prepared the OpenAI Sites worker artifact.");

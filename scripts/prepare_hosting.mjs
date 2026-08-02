import { copyFile, mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const targetDirectory = join(root, "dist", ".openai");

await mkdir(targetDirectory, { recursive: true });
await copyFile(
  join(root, ".openai", "hosting.json"),
  join(targetDirectory, "hosting.json"),
);

// vinext emits a fetch-compatible function as its default export. OpenAI Sites
// runs a Cloudflare-style module worker, whose entrypoint must expose a default
// object with a `fetch` method. Preserve the generated app and add that adapter.
const serverDirectory = join(root, "dist", "server");
await rename(
  join(serverDirectory, "index.js"),
  join(serverDirectory, "vinext-app.js"),
);
await writeFile(
  join(serverDirectory, "index.js"),
  `import handleRequest from "./vinext-app.js";\n\nexport default {\n  fetch(request, env, context) {\n    return handleRequest(request, env, context);\n  },\n};\n`,
);

console.log("Prepared the OpenAI Sites worker artifact.");

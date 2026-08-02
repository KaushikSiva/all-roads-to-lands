import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const targetDirectory = join(root, "dist", ".openai");

await mkdir(targetDirectory, { recursive: true });
await copyFile(
  join(root, ".openai", "hosting.json"),
  join(targetDirectory, "hosting.json"),
);

console.log("Prepared dist/.openai/hosting.json for OpenAI Sites.");

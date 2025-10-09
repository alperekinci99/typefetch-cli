import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function writeJson(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function writeText(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, "utf8");
}

export function pascalCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function deriveNameFromUrl(u: URL): string {
  const segs = u.pathname.split("/").filter(Boolean);
  const last = segs[segs.length - 1] || "Response";
  const base = pascalCase(last);
  return base || "Response";
}
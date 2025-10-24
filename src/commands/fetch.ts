import * as path from "node:path";
import { readFile } from "node:fs/promises";
import { fetch } from "undici";
import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage
} from "quicktype-core";
import { deriveNameFromUrl, ensureDir, writeJson, writeText } from "../utils/fsx.js";

type FetchOpts = {
  url: string;
  method?: string;
  header?: string[];          // ["k:v", "k2:v2"]
  body?: string;              // JSON string or "@file.json"
  name?: string;              // output type/file base name (without .ts)
  out?: string;               // output dir for types
  snapshotDir?: string;       // where to store JSON snapshots
  timeout?: number;           // ms
  maskEmail?: boolean;
  maskPhone?: boolean;
  nameFormat?: string;        // interface name pattern, e.g. "I{{name}}", "{{name}}Response", "{{name}}Dto"
  fileNameFormat?: string;    // file base pattern (without .ts), e.g. "{{name}}.interface", "{{name}}.dto"
};

function parseHeaders(arr?: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of arr ?? []) {
    const idx = raw.indexOf(":");
    if (idx === -1) continue;
    const k = raw.slice(0, idx).trim();
    const v = raw.slice(idx + 1).trim();
    if (k) out[k.toLowerCase()] = v;
  }
  return out;
}

async function parseBody(input?: string): Promise<unknown | undefined> {
  if (!input) return undefined;
  if (input.startsWith("@")) {
    const p = input.slice(1);
    const raw = await readFile(p, "utf8");
    return JSON.parse(raw);
  }
  return JSON.parse(input);
}

function maskPII(value: unknown, opts?: { maskEmail?: boolean; maskPhone?: boolean }): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(v => maskPII(v, opts));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = maskPII(v, opts);
    }
    return out;
  }
  if (typeof value === "string") {
    let s = value;
    if (opts?.maskEmail && /.+@.+\..+/.test(s)) {
      const [u, d] = s.split("@");
      s = `${u.slice(0, 2)}***@${d.replace(/^[^.]*/,"***")}`;
    }
    if (opts?.maskPhone && s.replace(/\D/g, "").length >= 10) {
      const onlyDigits = s.replace(/\D/g, "");
      // Maskeleme: son 4 hane hariç
      let iDigits = 0;
      s = s.replace(/\d/g, (d) => {
        const repl = iDigits < onlyDigits.length - 4 ? "*" : d;
        iDigits++;
        return repl;
      });
    }
    return s;
  }
  return value;
}

function pascalCase(s: string): string {
  return s
    .replace(/[_-\s]+(.)?/g, (_m, c) => (c ? String(c).toUpperCase() : ""))
    .replace(/^(.)/, (_m, c) => String(c).toUpperCase());
}

function formatPattern(
  pattern: string | undefined,
  base: string,
  fallback: string
): string {
  return (pattern ?? fallback).replace("{{name}}", base);
}

async function jsonToTypes(typeName: string, json: unknown): Promise<string> {
  const jsonInput = jsonInputForTargetLanguage("typescript");
  await jsonInput.addSource({ name: typeName, samples: [JSON.stringify(json)] });
  const inputData = new InputData();
  inputData.addInput(jsonInput);

  const result = await quicktype({
    inputData,
    lang: "typescript",
    rendererOptions: {
      "just-types": "true",
      "prefer-unions": "true",
      "nice-property-names": "true"
    }
  });

  return result.lines.join("\n");
}

export async function fetchCommand(opts: FetchOpts) {
  if (!opts.url) throw new Error("--url gerekli");
  const method = (opts.method ?? "GET").toUpperCase();
  const u = new URL(opts.url);

  // Base name türetme (örn: "getCustomer")
  const rawBase = (opts.name ?? deriveNameFromUrl(u)) || "Result";
  // Interface adı için PascalCase (örn: "GetCustomer")
  const baseName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(rawBase)
  ? pascalCase(rawBase)
  : `Item${pascalCase(rawBase)}`;

  // Interface name format (default: "{{name}}Response")
  const interfaceName = formatPattern(
    opts.nameFormat,
    baseName,
    "{{name}}Response"
  );

  // file name format
  const fileBase = formatPattern(
    opts.fileNameFormat,
    rawBase,
    "{{name}}"
  );

  const outDir = opts.out ?? "src/types/generated";
  const snapshotDir = opts.snapshotDir ?? ".typefetch-cli/snapshots";
  const timeout = typeof opts.timeout === "number" ? opts.timeout : 15000;

  const headers = parseHeaders(opts.header);
  if (!headers["content-type"] && method !== "GET" && opts.body) {
    headers["content-type"] = "application/json";
  }

  const body = await parseBody(opts.body);

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);

  const res = await fetch(u.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: ctrl.signal
  }).finally(() => clearTimeout(to));

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Response JSON değil veya parse edilemedi (status ${res.status}). İlk 200 karakter:\n${text.slice(0, 200)}`);
  }

  const sanitized = maskPII(json, { maskEmail: !!opts.maskEmail, maskPhone: !!opts.maskPhone });

  // 1) Snapshot yaz
  const snapshotPath = path.join(snapshotDir, `${rawBase}.json`);
  await writeJson(snapshotPath, sanitized);
  console.log(`✔ Snapshot → ${snapshotPath}`);

  // 2) Tip üret ve dosyaya yaz
  const dts = await jsonToTypes(interfaceName, sanitized);

  const header = `/* AUTO-GENERATED by typefetch-cli.
 * Source URL: ${u.toString()}
 * Method: ${method}
 * Snapshot: ${snapshotPath}
 * Top-level Interface: ${interfaceName}
 * Do not edit manually.
 */
`;

  const outFile = path.join(outDir, `${fileBase}.ts`);
  await ensureDir(outDir);
  await writeText(outFile, header + dts + "\n");
  console.log(`✔ Types → ${outFile}`);
}
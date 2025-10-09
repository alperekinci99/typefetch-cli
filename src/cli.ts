#!/usr/bin/env node
import { Command } from "commander";
import { fetchCommand } from "./commands/fetch.js";

const program = new Command();

program
  .name("typefetch-cli")
  .description("Generate TypeScript types from live API responses (configless).")
  .version("0.1.0");

program
  .command("fetch")
  .description("Call a single endpoint and generate types from its JSON response.")
  .requiredOption("--url <url>", "Full URL (with query if any)")
  .option("--method <method>", "HTTP method", "GET")
  .option(
    "--header <k:v...>",
    "Header(s), can repeat",
    (v: string, prev: string[] = []) => [...prev, v],
    [] as string[]
  )
  .option("--body <jsonOr@file>", "JSON string or @path/to/file.json")
  .option("--name <TypeName>", "Type / file name (default: derived from URL)")
  .option("--out <dir>", "Output dir for generated types", "src/types/generated")
  .option("--snapshot-dir <dir>", "Directory for JSON snapshots", ".typefetch-cli/snapshots")
  .option("--timeout <ms>", "Request timeout (ms)", (v) => parseInt(v, 10))
  .option("--mask-email", "Mask emails in snapshot")
  .option("--mask-phone", "Mask phones in snapshot")
  .action(async (opts) => {
    try {
      await fetchCommand(opts);
    } catch (err) {
      console.error("✖", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
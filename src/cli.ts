#!/usr/bin/env node
import { Command } from "commander";
import { fetchCommand } from "./commands/fetch.js";

const program = new Command();

program
  .name("typefetch-cli")
  .description("Generate TypeScript types from live API responses (configless).")
  .version("0.2.0");

program
  .command("fetch")
  .description("Call a single endpoint and generate types from its JSON response.")
  .option("--url <url>", "Full URL (with query if any)")
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
  .option("--name-format <pattern>", "Interface name format (e.g. I{{name}}, {{name}}Response, {{name}}Dto)")
  .option("--file-name-format <pattern>", "File name format without extension (e.g. {{name}}.interface, {{name}}.dto)")
  .option("--interactive", "Run interactive setup wizard", false)
  .action(async (opts) => {
    try {
      if (opts.interactive) {
        const { runInteractiveWizard } = await import("./interactive.js");
        const answers = await runInteractiveWizard({
          url: opts.url,
          out: opts.out,
          nameFormat: opts.nameFormat,
          fileNameFormat: opts.fileNameFormat,
          method: opts.method,
        });
        opts.url = answers.url;
        opts.out = answers.out;
        opts.nameFormat = answers.nameFormat;
        opts.fileNameFormat = answers.fileNameFormat;
        opts.method = answers.method;
      }

      // if it is not interactive, url is required
      if (!opts.interactive && !opts.url) {
        console.error("✖ Missing --url. Provide it or use --interactive.");
        process.exit(1);
      }

      await fetchCommand(opts);
    } catch (err) {
      console.error("✖", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
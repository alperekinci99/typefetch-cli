type WizardInput = {
  url?: string;
  out?: string;
  nameFormat?: string;
  fileNameFormat?: string;
  method?: string;
};

type Answers = {
  url: string;
  out: string;
  nameFormatPreset: string;
  nameFormat?: string;
  fileNameFormatPreset: string;
  fileNameFormat?: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
};

// Minimal, inquirer-agnostic question type
type Questions<T> = ReadonlyArray<{
  type: string;
  name: keyof T | string;
  message: string;
  choices?: ReadonlyArray<any>;
  default?: any;
  when?: (answers: T) => boolean;
  validate?: (input: any) => boolean | string;
}>;

export async function runInteractiveWizard(initial: WizardInput = {}) {
  // Lazy-load inquirer at runtime
  const { default: inquirer } = await import("inquirer");

  const questions: Questions<Answers> = [
    {
      type: "input",
      name: "url",
      message: "API URL (OpenAPI or endpoint):",
      default: initial.url ?? "",
      validate: (v: string) => {
        if (!v) return "Please enter a URL";
        try {
          new URL(v);
          return true;
        } catch {
          return "Please enter a valid URL (e.g. https://api.example.com/...)";
        }
      },
    },
    {
      type: "input",
      name: "out",
      message: "Output directory:",
      default: initial.out ?? "src/types/generated",
    },
    {
      type: "list",
      name: "nameFormatPreset",
      message: "Interface name format:",
      choices: [
        { name: "I{{name}}", value: "I{{name}}" },
        { name: "{{name}}Response", value: "{{name}}Response" },
        { name: "{{name}}Dto", value: "{{name}}Dto" },
        { name: "T{{name}}", value: "T{{name}}" },
        { name: "Custom…", value: "__custom__" },
      ],
      default: pickPreset(initial.nameFormat),
    },
    {
      type: "input",
      name: "nameFormat",
      message: "Custom pattern (use {{name}} placeholder):",
      when: (a) => a.nameFormatPreset === "__custom__",
      validate: (v: string) =>
        v && v.includes("{{name}}") ? true : "Pattern must include {{name}}",
      default:
        initial.nameFormat && !isPreset(initial.nameFormat)
          ? initial.nameFormat
          : undefined,
    },
    {
      type: "list",
      name: "fileNameFormatPreset",
      message: "File name format (without extension):",
      choices: [
        { name: "{{name}}.ts", value: "{{name}}" },
        { name: "{{name}}.types.ts", value: "{{name}}.types" },
        { name: "types.ts (single file)", value: "types" },
        { name: "Custom…", value: "__custom__" },
      ],
      default: pickPreset(initial.fileNameFormat, "{{name}}"),
    },
    {
      type: "input",
      name: "fileNameFormat",
      message: "Custom file pattern (use {{name}} placeholder):",
      when: (a) => a.fileNameFormatPreset === "__custom__",
      validate: (v: string) => !!(v ?? "").trim() || "Please enter a file base name or a pattern",
      default:
        initial.fileNameFormat && !isPreset(initial.fileNameFormat)
          ? initial.fileNameFormat
          : undefined,
    },
    {
      type: "list",
      name: "method",
      message: "HTTP method:",
      choices: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      default: (initial.method ?? "GET").toUpperCase(),
    },
  ];

  const answers = await inquirer.prompt<Answers>(questions as any);

  return {
    url: answers.url,
    out: answers.out,
    nameFormat:
      answers.nameFormatPreset !== "__custom__"
        ? answers.nameFormatPreset
        : (answers.nameFormat as string),
    fileNameFormat:
      answers.fileNameFormatPreset !== "__custom__"
        ? answers.fileNameFormatPreset
        : (answers.fileNameFormat as string),
    method: answers.method,
  };
}

/* Helpers */

function pickPreset(pattern?: string, fallback?: string) {
  if (!pattern) return fallback ?? "{{name}}";
  return isPreset(pattern) ? pattern : "__custom__";
}

function isPreset(pattern: string) {
  const presets = new Set<string>([
    "I{{name}}",
    "{{name}}Response",
    "{{name}}Dto",
    "T{{name}}",
    "{{name}}",
    "{{name}}.types",
    "types",
  ]);
  return presets.has(pattern);
}
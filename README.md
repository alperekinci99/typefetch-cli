# 🧩 typefetch-cli

Fetch any API endpoint and automatically generate TypeScript types from its **live JSON response**.  
Perfect for frontend developers who want instant, schema-free typing.

---

## ✨ Features
- ⚡ **Configless** — Just run one command.
- 🧠 **Smart type inference** (powered by [quicktype](https://github.com/quicktype/quicktype)).
- 💾 **Snapshot system** — Keep a record of your API responses.
- 🧩 **Interactive mode** — Choose name and file formats step-by-step.
- 💻 **CLI-friendly** — Designed for dev environments and CI pipelines.

---

## 🚀 Installation
npm i -D typefetch-cli

## 🧰 Usage
npx typefetch-cli fetch \
  --url "https://jsonplaceholder.typicode.com/posts/1" \
  --name Post \
  --out src/types/generated \
  --snapshot-dir .typefetch-cli/snapshots

## Interactive mode Usage
npx typefetch-cli fetch --interactive

## Options
| Option | Description | Default |
|--------|--------------|----------|
| `--url <string>` | Full URL (required) | — |
| `--method <string>` | HTTP method | `GET` |
| `--header <key:value>` | Add request headers (repeatable) | — |
| `--body <json or @file.json>` | JSON string or file reference | — |
| `--name <TypeName>` | Generated type/interface name | derived from URL |
| `--out <dir>` | Output directory for types | `src/types/generated` |
| `--snapshot-dir <dir>` | Directory for JSON snapshots | `.typefetch-cli/snapshots` |
| `--name-format <pattern>` | Interface name pattern (e.g. `I{{name}}`, `{{name}}Response`) | `{{name}}Response` |
| `--file-name-format <pattern>` | File name pattern (`{{name}}`, `{{name}}.types`, `types`) | `{{name}}` |
| `--mask-email` | Mask email addresses in snapshot | — |
| `--mask-phone` | Mask phone numbers in snapshot | — |
| `--interactive` | Run interactive setup wizard | false |

---

MIT © [Alper Ekinci](https://github.com/alperekinci99)

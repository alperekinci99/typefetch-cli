# 🧩 typefetch-cli

Fetch any API endpoint and automatically generate TypeScript types from its **live JSON response**.  
Perfect for frontend developers who want instant, schema-free typing.

---

## ✨ Features
- ⚡ **Configless** — Just run one command.
- 🧠 **Smart type inference** (powered by [quicktype](https://github.com/quicktype/quicktype)).
- 🧩 **Snapshot system** — Keep a record of your API responses.
- 💻 **CLI-friendly** — Designed for dev environments and CI pipelines.

---

## 🚀 Installation
\`\`\`bash
npm i -D typefetch-cli
\`\`\`

## 🧰 Usage
\`\`\`bash
npx typefetch-cli fetch \
  --url "https://jsonplaceholder.typicode.com/posts/1" \
  --name Post \
  --out src/types/generated \
  --snapshot-dir .typefetch/snapshots
\`\`\`

## Options
| Option | Description | Default |
|--------|--------------|----------|
| \`--url <string>\` | Full URL (required) | — |
| \`--method <string>\` | HTTP method | \`GET\` |
| \`--header <key:value>\` | Add request headers (repeatable) | — |
| \`--body <json or @file.json>\` | JSON string or file reference | — |
| \`--name <TypeName>\` | Generated type/interface name | derived from URL |
| \`--out <dir>\` | Output directory for types | \`src/types/generated\` |
| \`--snapshot-dir <dir>\` | Directory for JSON snapshots | \`.typefetch/snapshots\` |
| \`--cwd <path>\` | Base directory to resolve paths | current dir |
| \`--stdout-types\` | Print types to STDOUT instead of writing files | — |
| \`--mask-email\` | Mask email addresses in snapshot | — |
| \`--mask-phone\` | Mask phone numbers in snapshot | — |

---

## 📦 Publishing (for contributors)
\`\`\`bash
npm login
npm version patch
npm publish --access public
\`\`\`

MIT © [Alper Ekinci](https://github.com/alperekinci99)

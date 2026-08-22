# dsh-mcp-manager

<!-- Hero -->
<div align="center">
  <b style="font-size: 1.15em;">A visual MCP manager — installed or not, connected or not, at a glance</b><br /><br />
  <code>Server list</code> <code>Add / Remove</code> <code>Enable / Disable</code> <code>Connection status</code> <code>Connectivity test</code> <code>zh / en</code><br />
  <code>DeepSeek Harness</code> <code>DSH Desktop</code><br /><br />
  Manage every MCP server in DeepSeek Harness from <b>Settings → MCP</b>,<br />
  no more hand-editing <code>cordis.patch.yml</code> — every change applies live (HMR hot reload).
</div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/@js2hou/dsh-mcp-manager?logo=npm&color=cb3837)](https://www.npmjs.com/package/@js2hou/dsh-mcp-manager)
[![License](https://img.shields.io/github/license/Js2Hou/dsh-mcp-manager)](LICENSE)
[![DSH Desktop](https://img.shields.io/badge/DSH%20Desktop-ready-000000)](https://github.com/anywhere-labs/deepseek-harness-desktop)

<!-- listings:start -->
[![dsh-market](https://img.shields.io/badge/dsh--market-%E2%9C%93-3fb950)](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
[![dsh-plugin-marketplace](https://img.shields.io/badge/dsh--plugin--marketplace-%E2%9C%93-3fb950)](https://github.com/AwesomeHou/dsh-plugin-marketplace)
[![DSH 1024Store](https://img.shields.io/badge/DSH%201024Store-%E2%9C%93-3fb950)](https://github.com/imsai-sh/awesome-deepseek-harness-plugins)
[![dshfind](https://img.shields.io/badge/dshfind-%E2%9C%93-3fb950)](https://github.com/hikariming/dshfind)
<!-- listings:end -->






</div>

<div align="center">
  🌏 <a href="./README.md">中文</a> · <a href="./README_EN.md"><b>English</b></a>
</div>

## ✨ Features

- **📋 Server list** — every installed/enabled MCP server (`@deepseek-ai/dsh-mcp-client` instance): `serverName`, transport (`stdio` / `streamable-http`), URL / command, enabled state, loader phase, registered tool count
- **➕ Add / ➖ Remove** — validated form for stdio and streamable-http servers (env / headers / args / timeout / failOnStartupError), duplicate id/serverName rejected; one-click removal
- **🔌 Enable / Disable** — toggle anytime; tools hot-connect / hot-disconnect
- **📶 Connection status** — live status pill per server (Connected · N tools / Failed / Loading / Disabled) plus an independent **Test** probe (`initialize` + `tools/list`) reporting latency and tool count
- **✏️ Edit** — the edit form opens in place of the card being edited; save applies immediately
- **🌏 Localized** — UI copy follows the DSH language (zh / en) in real time
- **💾 Persistent** — every mutation is written to the profile's `cordis.patch.yml` and survives restarts; the footer shows the file path

## 🚀 Install

Listed on **[dsh-market](https://github.com/dsh-market/dsh-market)** and **[dsh-plugin-marketplace](https://github.com/AwesomeHou/dsh-plugin-marketplace)**.

**Prerequisites**: DSH installed and running (`dsh web` works).

### Option 1 · AI agent install

> Tell your agent: "Please install the dsh-mcp-manager plugin from https://github.com/Js2Hou/dsh-mcp-manager"

### Option 2 · Plugin marketplace (recommended)

Pick one of the marketplaces:

- **[DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) (community desktop build)**: built-in plugin market — pick the **DSH 1024Store** or **dshfind** source and search for `js2hou/dsh-mcp-manager` (several plugins share that name — pick the one by **Js2Hou**);
- **[dsh-market](https://github.com/dsh-market/dsh-market)**: search for `js2hou/dsh-mcp-manager` and install with one click;
- **[dsh-plugin-marketplace](https://github.com/AwesomeHou/dsh-plugin-marketplace)**: search for `js2hou/dsh-mcp-manager` and install with one click.

### Option 3 · dsh CLI

```sh
dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

Or install straight from GitHub (the built `lib/` bundles are committed, so no local build is needed):

```sh
dsh plugin --profile web add github:Js2Hou/dsh-mcp-manager
```

<details>
<summary><b>Script install</b> (one-liner: handles the 24h release-age gate and stale mounts, idempotent)</summary>

**macOS / Linux** (also Git Bash / WSL on Windows):

```sh
curl -fsSL https://raw.githubusercontent.com/Js2Hou/dsh-mcp-manager/main/scripts/install.sh | bash
```

**Windows (PowerShell 5.1+ / pwsh)**:

```powershell
irm https://raw.githubusercontent.com/Js2Hou/dsh-mcp-manager/main/scripts/install.ps1 | iex
```

</details>

Then **hard-refresh the browser** (Cmd/Ctrl+Shift+R) and open **Settings → MCP**. If the MCP tab does not appear, restart DSH once (first-time host mounting).

<details>
<summary><b>Manual install / local development</b></summary>

**macOS / Linux (bash)**:

```sh
cd ~/.dsh/profiles/web

# ① Exclude a freshly published version from pnpm's 24h minimum-release-age
printf '\nminimumReleaseAgeExclude:\n  - @js2hou/dsh-mcp-manager\n' >> pnpm-workspace.yaml

# ② Install + auto-mount (npm package; use an absolute link: path for a local checkout)
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

**Windows (PowerShell)**:

```powershell
cd ~\.dsh\profiles\web

# ① Exclude fresh versions (one-time; merge the line if the key already exists)
Add-Content -Path pnpm-workspace.yaml -Value "`nminimumReleaseAgeExclude:`n  - @js2hou/dsh-mcp-manager"

# ② Install + auto-mount
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

> `dsh plugin --profile web add` registers the dependency, detects the package's `dsh.bundle.patch`, and adds it to `dsh.profile.bundles` — no manual `cordis.patch.yml` edits needed.

**Local development**: clone the repo and run `bash scripts/install.sh` from its root (Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1`); the script detects the checkout and installs it into `~/.dsh/profiles/web` via `link:`. Or pass the path explicitly: `dsh plugin --profile web add "link:C:/absolute/path/dsh-mcp-manager"`.

</details>

<details>
<summary><b>Update</b></summary>

```sh
dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

Or re-run the one-liner; alternatively bump the version in `~/.dsh/profiles/web/package.json` and run `pnpm install`. Local-checkout mode: `git pull` then `pnpm build` (client changes need only a hard refresh; host changes need a DSH restart).

</details>

<details>
<summary><b>FAQ</b></summary>

| Symptom | Cause / fix |
|---|---|
| Not found in the plugin marketplace | Marketplace data syncs daily. Search again later, or install via Option 3 (`dsh plugin ...`). |
| `minimum release age` / version < 24h | The published version is younger than 24h. Wait, or re-run (the script appends `minimumReleaseAgeExclude`). |
| "Profile not found" | Run `dsh web` once to initialize `~/.dsh/profiles/web`. |
| **Two MCP tabs** | Double-mount: a stale manual `- insert: ... mcp-manager ...` row still lives in `cordis.patch.yml` — delete it (the script does this automatically). |
| No MCP tab after install | Hard refresh (Cmd/Ctrl+Shift+R); if still missing, restart DSH once (first-time host mounting). |
| Obsidian MCP returns 401 | Check the header format: `Authorization: Bearer <api-key>` without surrounding quotes (the form now strips quotes from pasted `"Key": "value"` lines). |
| Config change not applied | All mutations hot-apply via HMR within 1–2s; use the manual refresh button in the page header if needed. |

</details>

## 📖 Usage

Open **Settings → MCP**:

- **Add server** — fill in the entry id, `serverName`, transport, and transport-specific fields (`streamable-http`: URL; `stdio`: command / args / env / cwd). The panel validates format and rejects duplicate ids / serverNames.
- Each card shows the live status, target, and tool count, with **Enable / Disable**, **Test** (connectivity probe), **Edit** (inline form), and **Remove**.
- The footer shows the patch file being edited.

## ⚙️ Configuration

The plugin's loader row accepts one optional field:

| Field | Description |
|---|---|
| `patchFile` | Absolute path of the user patch layer to edit. Defaults to `$DSH_HOME/profiles/web/cordis.patch.yml`. |

## 🏗️ Architecture

- **Host half** (`src/index.ts`) registers a loopback-only Connection RPC channel `/mcp-manager`: `list` (enumerates `@deepseek-ai/dsh-mcp-client` entries via `ctx.loader` + tool counts via `ctx.tools`), `add` / `remove` / `setEnabled` / `update` (edits the profile patch layer, persisted and HMR-applied), `probe` (independent MCP SDK connectivity probe), `patchInfo`. Zero runtime `@deepseek-ai` imports (the js-yaml `!!js` dialect and `isJsExpr` are inlined), so it can be installed from any path.
- **Browser half** (`src/client`) registers the Settings → MCP section (`settings.section` slot, order 18), provides zh/en copy via `ctx.locale`, and talks to the host exclusively over the RPC channel — it never touches the filesystem.
- **Test fixture** — `test/fixtures/mcp-test-server.mjs` is a minimal MCP stdio server for end-to-end verification.

## Development

```bash
pnpm install
pnpm typecheck   # tsc --noEmit; tsconfig paths point at your DSH install's lib/types
pnpm build       # esbuild: lib/index.js (host) + lib/client.js (ModuleLoader browser bundle)
```

## License

MIT

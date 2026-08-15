# dsh-mcp-manager

[中文说明](README.zh.md)

A visual **MCP manager** plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). It adds an **MCP** page to the web GUI's **Settings** panel (next to 通用设置 / 模型 / 插件 / Agent 预设) so you can see — and manage — every MCP server wired into the harness without hand-editing config files:

- **Inspect** — every installed/enabled MCP server (`@deepseek-ai/dsh-mcp-client` instance): `serverName`, transport (`stdio` / `streamable-http`), URL / command, enabled state, loader lifecycle phase, and the number of `mcp__<serverName>__*` tools currently registered.
- **Add / Remove** — add new MCP servers through a validated form (stdio and streamable-http, env / headers / args / timeout / failOnStartupError); remove existing ones.
- **Enable / Disable** — toggle servers on and off; tools are connected/disconnected live.
- **Connection status** — per-server status badge (Connected · N tools / Failed / Loading / Disabled) plus an on-demand **Test** button that runs an independent live probe (`initialize` + `tools/list`) and reports latency and tool count.

All mutations edit the web profile's `cordis.patch.yml`; the harness HMR watcher hot-applies them, so changes take effect immediately — no restart — and survive restarts.

## Features

| Capability | Where |
|---|---|
| List installed/enabled MCP servers with live status | Settings → MCP |
| Add / edit / remove servers (stdio + streamable-http) | Settings → MCP → Add server / Edit / Remove |
| Enable / disable (hot disconnect / reconnect) | per-card Enable / Disable |
| Live connectivity probe (latency + tool count) | per-card Test |
| All edits persist to `cordis.patch.yml` (hot-applied via HMR) | shown in the page footer |

## Requirements

- DeepSeek Harness desktop app (web profile), any recent build
- Node.js 20+, [pnpm](https://pnpm.io) (to build)

## Install

```bash
# 1. build the plugin (in this repo)
pnpm install
pnpm build            # -> lib/index.js (host) + lib/client.js (browser)

# 2. link it into the web profile
#    add to ~/.dsh/profiles/web/package.json dependencies:
#      "dsh-mcp-manager": "link:/absolute/path/to/dsh-mcp-manager"
cd ~/.dsh/profiles/web
pnpm install

# 3. enable it in the profile patch layer (~/.dsh/profiles/web/cordis.patch.yml):
#    - insert:
#        - id: mcp-manager
#          name: 'dsh-mcp-manager'
```

The profile HMR watcher activates the plugin; then **refresh the web GUI** — you'll find **MCP** inside **Settings**. (On some setups a full app restart is needed the first time.)

## Usage

Open **Settings → MCP**:

- **Add server** — fill in the entry id, `serverName`, transport, and the transport-specific fields (URL for `streamable-http`; command / args / env / cwd for `stdio`). The panel validates the input and rejects duplicate ids / serverNames.
- Each server card shows its live status, target, and tool count. Use **Enable / Disable**, **Test** (live probe), **Edit**, and **Remove**.
- The footer shows the exact patch file being edited.

## Config

The plugin's own loader row accepts one optional config:

| Field | Description |
|---|---|
| `patchFile` | Absolute path of the user patch layer to edit. Defaults to `$DSH_HOME/profiles/web/cordis.patch.yml`. |

## Development

```bash
pnpm install
pnpm typecheck   # tsc --noEmit; tsconfig paths point at your DSH install's lib/types
pnpm build       # esbuild: lib/index.js (node half) + lib/client.js (ModuleLoader bundle)
```

- `test/fixtures/mcp-test-server.mjs` is a minimal MCP stdio server for end-to-end testing (`node test/fixtures/mcp-test-server.mjs`).
- During development, after rebuilding, the profile's client-modules watcher re-hashes `lib/client.js` automatically (bundle rev appears in `window.__DSH_BOOT__`); a page refresh picks it up. Host-half changes need the app (or the plugin entry) reloaded.

### Notes / known behavior

- The plugin normalizes `cordis.patch.yml` when it writes (js-yaml round-trip): entries are preserved, but comments outside the managed entries are not. The file header explains that the file is plugin-managed.
- MCP entries defined in a *bundle* patch layer (not the user patch) can be **disabled** (via a user-layer override) but not removed — removal only works for user-patch entries.

## Architecture

- **Host half** (`src/index.ts`) registers a loopback-only Connection RPC channel `/mcp-manager` and implements: `list` (enumerates `ctx.loader` for `@deepseek-ai/dsh-mcp-client` entries + tool counts from `ctx.tools`), `add` / `remove` / `setEnabled` / `update` (edit the profile patch layer, persisted + HMR-applied), `probe` (independent MCP SDK connection), `patchInfo`.
- **Browser half** (`src/client`) registers the Settings → MCP section (`settings.section` slot, order 18) and talks to the host exclusively over the RPC channel — it never touches the filesystem.

## License

MIT

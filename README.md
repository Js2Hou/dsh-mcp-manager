# dsh-mcp-manager

<!-- Hero -->
<div align="center">
  <b style="font-size: 1.15em;">MCP 可视化管理器：装没装、连没连，一目了然</b><br /><br />
  <code>查看列表</code> <code>新增删除</code> <code>启用停用</code> <code>连接状态</code> <code>连接测试</code> <code>中英双语</code><br />
  <code>DeepSeek Harness</code> <code>DSH Desktop</code><br /><br />
  <b>设置 → MCP</b> 一站管理 DeepSeek Harness 里的所有 MCP 服务器，<br />
  无需再手改 <code>cordis.patch.yml</code> —— 所有修改即改即生效（HMR 热应用）。
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
  🌏 <a href="./README.md"><b>中文</b></a> · <a href="./README_EN.md">English</a>
</div>

## ✨ 功能一览

- **📋 服务器列表**：列出所有已安装/启用的 MCP 服务器（`@deepseek-ai/dsh-mcp-client` 实例）——`serverName`、传输方式（`stdio` / `streamable-http`）、URL / 命令、启用状态、加载阶段、已注册工具数
- **➕ 新增 / ➖ 删除**：表单添加 MCP 服务器（stdio 与 streamable-http，支持 env / headers / args / 超时 / failOnStartupError），带格式与重名校验；一键删除
- **🔌 启用 / 停用**：随时切换，工具随之热连接 / 热断开
- **📶 连接状态**：每台服务器实时状态胶囊（Connected · N tools / Failed / Loading / Disabled）+ 独立 **Test** 探测（`initialize` + `tools/list`，报告延迟与工具数）
- **✏️ 编辑**：在被编辑卡片原位展开表单，保存即应用
- **🌏 多语言**：界面文案跟随 DSH 语言（zh / en）实时切换
- **💾 持久化**：所有修改写入 profile 的 `cordis.patch.yml`，重启后保留；页面底部显示文件路径

## 🚀 安装

插件已收录至 **[dsh-market](https://github.com/dsh-market/dsh-market)** 与 **[dsh-plugin-marketplace](https://github.com/AwesomeHou/dsh-plugin-marketplace)**。

**前置**：DSH 已装好（`dsh web` 能正常运行）。

### 方式一 · AI Agent 安装

> 告诉 Agent：「请安装 dsh-mcp-manager 插件，插件仓库是 https://github.com/Js2Hou/dsh-mcp-manager」

### 方式二 · 插件市场安装（推荐）

任选一个插件市场：

- **[DSH Desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)（社区桌面版）**：内置插件市场，选 **DSH 1024Store** 或 **dshfind** 源，搜索 `js2hou/dsh-mcp-manager` 安装（同名插件较多，认准作者 **Js2Hou**）；
- **[dsh-market](https://github.com/dsh-market/dsh-market)**：搜索 `js2hou/dsh-mcp-manager` 一键安装；
- **[dsh-plugin-marketplace](https://github.com/AwesomeHou/dsh-plugin-marketplace)**：搜索 `js2hou/dsh-mcp-manager` 一键安装。

### 方式三 · dsh 命令安装

```sh
dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

也可 **GitHub 源安装**（构建产物 `lib/` 已入库，无需本地构建）：

```sh
dsh plugin --profile web add github:Js2Hou/dsh-mcp-manager
```

<details>
<summary><b>脚本安装</b>（一键脚本安装：自动处理新版放行与残留清理，幂等）</summary>

**macOS / Linux**（Windows 装了 Git Bash 或 WSL 也可）：

```sh
curl -fsSL https://raw.githubusercontent.com/Js2Hou/dsh-mcp-manager/main/scripts/install.sh | bash
```

**Windows（PowerShell 5.1+ / pwsh）**：

```powershell
irm https://raw.githubusercontent.com/Js2Hou/dsh-mcp-manager/main/scripts/install.ps1 | iex
```

</details>

装完**硬刷新浏览器**（Cmd/Ctrl+Shift+R），打开 **设置 → MCP** 即可看到管理页。若未出现 MCP 页签，重启一次 DSH（host 半首次挂载需要）。

<details>
<summary><b>手动安装 / 本地开发</b></summary>

**macOS / Linux（bash）**：

```sh
cd ~/.dsh/profiles/web

# ① 放行「发布不足 24h」的新版本（装老版本可跳过；若已有该键，把下面那行并入其下即可）
printf '\nminimumReleaseAgeExclude:\n  - @js2hou/dsh-mcp-manager\n' >> pnpm-workspace.yaml

# ② 安装并自动挂载（npm 包；本地 checkout 请用 link: 绝对路径）
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

**Windows（PowerShell）**：

```powershell
cd ~\.dsh\profiles\web

# ① 放行新版本（一次性；若已有该键，把 - @js2hou/dsh-mcp-manager 并入其下即可）
Add-Content -Path pnpm-workspace.yaml -Value "`nminimumReleaseAgeExclude:`n  - @js2hou/dsh-mcp-manager"

# ② 安装并自动挂载
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

> `dsh plugin --profile web add` 会自动：登记依赖 → 识别包内 `dsh.bundle.patch` → 注册进 `dsh.profile.bundles` 挂载，无需手改 `cordis.patch.yml`。

**本地开发**：clone 仓库后在根目录执行 `bash scripts/install.sh`（Windows：`powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1`），脚本检测到 checkout 会自动用 `link:` 方式安装到 `~/.dsh/profiles/web`；也可显式指定：`dsh plugin --profile web add "link:C:/绝对路径/dsh-mcp-manager"`。

</details>

<details>
<summary><b>更新</b></summary>

```sh
dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

或重跑一次一键脚本；也可把 `~/.dsh/profiles/web/package.json` 里的版本号改高后 `pnpm install`。本地 checkout 模式：`git pull` 后 `pnpm build`（client 改动硬刷新浏览器即可；host 改动需重启 DSH）。

</details>

<details>
<summary><b>常见问题</b></summary>

| 现象 | 原因与解决 |
|---|---|
| 插件市场搜不到 | 市场数据每日同步。稍后再搜，或改用「方式三」dsh 命令安装。 |
| 报 `minimum release age` / 版本不足 24h | 装的版本发布不足 24 小时。等 24h 或重跑一次（脚本会自动补 `minimumReleaseAgeExclude`）。 |
| 报「找不到 profile 目录」 | 先跑一次 `dsh web`，让它初始化 `~/.dsh/profiles/web`。 |
| 页面出现**两个 MCP 页签** | 双挂载：`~/.dsh/profiles/web/cordis.patch.yml` 还留着旧的手动挂载行，删掉那段 `- insert: ... mcp-manager ...`（脚本会自动清）。 |
| 装完没看到 MCP 页签 | 硬刷新（Cmd/Ctrl+Shift+R）；仍没有就重启 DSH 一次（host 半首次挂载需要）。 |
| Obsidian MCP 报 401 | 检查 headers 格式：应为 `Authorization: Bearer <api-key>`，不要带引号（表单已支持直接粘贴 `"Key": "value"` 自动去引号）。 |
| 修改配置后未生效 | 本插件所有修改走 HMR 热应用，等 1–2 秒自动刷新；页面右上角可手动刷新。 |

</details>

## 📖 使用说明

打开 **设置 → MCP**：

- **添加服务器**：填写 条目 ID、`serverName`、传输方式及对应字段（`streamable-http` 填 URL；`stdio` 填 command / args / env / cwd）。面板做格式与重名校验，重复的 id / serverName 会被拒绝。
- 每张卡片显示实时状态、连接目标与工具数；可执行 **启用 / 停用**、**测试**（连接探测）、**编辑**（原位表单）、**删除**。
- 页面底部显示正在编辑的补丁文件路径。

## ⚙️ 配置

插件自身在 loader 中的行配置支持一个可选字段：

| 字段 | 说明 |
|---|---|
| `patchFile` | 要编辑的用户补丁层绝对路径。默认 `$DSH_HOME/profiles/web/cordis.patch.yml`。 |

## 🏗️ 架构

- **宿主端**（`src/index.ts`）注册一个仅限 loopback 的 Connection RPC 通道 `/mcp-manager`：`list`（遍历 `ctx.loader` 中的 `@deepseek-ai/dsh-mcp-client` 条目 + `ctx.tools` 统计工具数）、`add` / `remove` / `setEnabled` / `update`（编辑 profile 补丁层，持久化并经 HMR 应用）、`probe`（独立 MCP SDK 连接探测）、`patchInfo`。运行时零 `@deepseek-ai` 依赖（js-yaml 方言、`isJsExpr` 均内联），可放在任意路径安装。
- **浏览器端**（`src/client`）注册 设置 → MCP 页（`settings.section` 槽位，order 18），经 `ctx.locale` 提供中英双语，与宿主端仅通过 RPC 通道通信——浏览器端不直接访问文件系统。
- **测试 fixture**：`test/fixtures/mcp-test-server.mjs` 是一个最小 MCP stdio 服务器，用于端到端验证。

## 开发

```bash
pnpm install
pnpm typecheck   # tsc --noEmit；tsconfig paths 指向你的 DSH 安装目录下的 lib/types
pnpm build       # esbuild：lib/index.js（宿主端）+ lib/client.js（ModuleLoader 浏览器 bundle）
```

## 许可证

MIT

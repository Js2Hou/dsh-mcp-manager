# dsh-mcp-manager

<!-- Hero -->
<div align="center">
  <b style="font-size: 1.15em;">MCP 可视化管理器：装没装、连没连，一目了然</b><br /><br />
  <code>查看列表</code> <code>新增删除</code> <code>启用停用</code> <code>连接状态</code> <code>连接测试</code> <code>中英双语</code><br /><br />
  <b>设置 → MCP</b> 一站管理 DeepSeek Harness 里的所有 MCP 服务器，<br />
  无需再手改 <code>cordis.patch.yml</code> —— 所有修改即改即生效（HMR 热应用）。
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

**前置**：已装好 DSH（`dsh web` 能正常运行），Node.js ≥ 20、pnpm ≥ 10。

### 一键安装

**macOS / Linux**（Windows 装了 Git Bash 或 WSL 也可）：

```sh
curl -fsSL https://raw.githubusercontent.com/Js2Hou/dsh-mcp-manager/main/scripts/install.sh | bash
```

**Windows（PowerShell 5.1+ / pwsh）**：

```powershell
irm https://raw.githubusercontent.com/Js2Hou/dsh-mcp-manager/main/scripts/install.ps1 | iex
```

一键脚本会从 npm 安装 `@js2hou/dsh-mcp-manager` 并自动挂载；想基于本地源码调试时，直接在仓库 clone 里执行 `.\scripts\install.ps1`（脚本检测到本地 checkout 会自动用 `link:` 安装）。

装完**硬刷新浏览器**（Cmd/Ctrl+Shift+R），打开 **设置 → MCP** 即可看到管理页。若未出现 MCP 页签，重启一次 DSH（host 半首次挂载需要）。

<details>
<summary><b>本地安装（开发调试；从仓库 clone 安装）</b></summary>

把仓库 clone/复制到任意目录后，在仓库根目录执行：

```sh
# macOS / Linux
bash scripts/install.sh

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

脚本检测到这是 `@js2hou/dsh-mcp-manager` 的 checkout，会自动用 `link:` 方式安装到 `~/.dsh/profiles/web` 并挂载。也可显式指定其他路径：

```powershell
.\scripts\install.ps1 -Path C:\path\to\dsh-mcp-manager -Restart
```

</details>

<details>
<summary><b>手动安装（逐步命令，想看清每一步）</b></summary>

**macOS / Linux（bash）**：

```sh
cd ~/.dsh/profiles/web

# ① 放行「发布不足 24h」的新版本（装老版本可跳过；若已有该键，把下面那行并入其下即可）
printf '\nminimumReleaseAgeExclude:\n  - @js2hou/dsh-mcp-manager\n' >> pnpm-workspace.yaml

# ② 安装并自动挂载（npm 包；本地 checkout 请用 link: 绝对路径）
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

> 也可直接 **GitHub 源安装**（构建产物 `lib/` 已入库，git 源安装不触发构建、无需本地构建）：
> `dsh plugin --profile web add github:Js2Hou/dsh-mcp-manager`

**Windows（PowerShell）**：

```powershell
cd ~\.dsh\profiles\web

# ① 放行新版本（一次性；若已有该键，把 - @js2hou/dsh-mcp-manager 并入其下即可）
Add-Content -Path pnpm-workspace.yaml -Value "`nminimumReleaseAgeExclude:`n  - @js2hou/dsh-mcp-manager"

# ② 安装并自动挂载
npx -y --package @deepseek-ai/dsh dsh plugin --profile web add @js2hou/dsh-mcp-manager
```

> `dsh plugin --profile web add` 会自动：登记依赖 → 识别包内 `dsh.bundle.patch` → 注册进 `dsh.profile.bundles` 挂载 → 无需手改 `cordis.patch.yml`。本地 checkout 用 `dsh plugin --profile web add "link:C:/绝对路径/@js2hou/dsh-mcp-manager"` 同理。

</details>

<details>
<summary><b>脚本内部做了什么（技术细节）</b></summary>

一键脚本自动完成 4 件事（全部幂等，可安全重复执行）：

1. 解析 dsh CLI：优先用桌面应用内置的 `dsh`（版本与运行中的应用完全一致、离线秒装），其次 npx，最后 PATH 上的 `dsh`；
2. 预写 `minimumReleaseAgeExclude`，放行「发布不足 24 小时」的新版本（本插件无原生依赖，无需 `pnpm approve-builds`）；
3. 清理旧版残留的手动挂载行（`cordis.patch.yml` 中 id 为 `mcp-manager` 的 insert 块），避免「双挂载」（页面出现两个 MCP 页签）；
4. 执行 `dsh plugin --profile web add <包名|link:路径>`：登记依赖 → 识别包内 `dsh.bundle.patch` → 自动注册进 `dsh.profile.bundles` 挂载。

`curl | bash` / `irm | iex` 会执行远程代码——脚本已随仓库开源（`scripts/install.sh` / `scripts/install.ps1`），可先下载审阅。插件以 npm 包 `@js2hou/dsh-mcp-manager` 发布，通过 `dsh.bundle.patch`（随包的 `cordis.patch.yml`）由官方 CLI 自动挂载，**不修改 DSH 源码**。

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

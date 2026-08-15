# dsh-mcp-manager

[English README](README.md)

面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 **MCP 可视化管理器**插件。它在 Web 界面的**设置**面板中新增一个 **MCP** 页（与 通用设置 / 模型 / 插件 / Agent 预设 并列），让你无需手改配置文件即可查看和管理接入 Harness 的所有 MCP 服务器：

- **查看** —— 列出所有已安装/已启用的 MCP 服务器（即 `@deepseek-ai/dsh-mcp-client` 实例）：`serverName`、传输方式（`stdio` / `streamable-http`）、URL / 命令、启用状态、加载器生命周期阶段，以及当前已注册的 `mcp__<serverName>__*` 工具数量。
- **新增 / 删除** —— 通过带校验的表单添加 MCP 服务器（支持 stdio 与 streamable-http，可配 env / headers / args / 超时 / failOnStartupError）；一键删除已有服务器。
- **启用 / 停用** —— 随时开启或停用服务器，工具随之热连接/热断开。
- **连接状态** —— 每台服务器显示实时状态徽标（Connected · N tools / Failed / Loading / Disabled），并可通过 **Test** 按钮发起独立探测（`initialize` + `tools/list`），报告延迟与工具数量。

所有修改都会写入 web profile 的 `cordis.patch.yml`；Harness 的 HMR 监听器会热应用变更，因此无需重启即可生效，且重启后仍然保留。

## 功能一览

| 能力 | 位置 |
|---|---|
| 查看已安装/启用的 MCP 服务器与实时状态 | 设置 → MCP |
| 新增 / 编辑 / 删除服务器（stdio + streamable-http） | 设置 → MCP → Add server / Edit / Remove |
| 启用 / 停用（热断开 / 热重连） | 每张服务器卡片上的 Enable / Disable |
| 连接探测（延迟 + 工具数） | 每张卡片上的 Test |
| 所有修改持久化到 `cordis.patch.yml`（经 HMR 热应用） | 页面底部显示文件路径 |

## 环境要求

- DeepSeek Harness 桌面应用（web profile），任意较新版本
- Node.js 20+ 与 [pnpm](https://pnpm.io)（用于构建）

## 安装

```bash
# 1. 构建插件（在本仓库目录内）
pnpm install
pnpm build            # 生成 lib/index.js（宿主端）+ lib/client.js（浏览器端）

# 2. 链接到 web profile
#    在 ~/.dsh/profiles/web/package.json 的 dependencies 中加入：
#      "dsh-mcp-manager": "link:/绝对路径/dsh-mcp-manager"
cd ~/.dsh/profiles/web
pnpm install

# 3. 在 profile 补丁层启用（~/.dsh/profiles/web/cordis.patch.yml）：
#    - insert:
#        - id: mcp-manager
#          name: 'dsh-mcp-manager'
```

profile 的 HMR 监听器会自动激活插件；随后**刷新 Web 界面**即可在 **设置** 中看到 **MCP** 页。（部分环境下首次安装需要重启应用。）

## 使用说明

打开 **设置 → MCP**：

- **Add server** —— 填写 entry id、`serverName`、传输方式及对应字段（`streamable-http` 填 URL；`stdio` 填 command / args / env / cwd）。面板会做输入校验，并拒绝重复的 id 与 serverName。
- 每张服务器卡片显示实时状态、连接目标与工具数量；可执行 **Enable / Disable**（启用/停用）、**Test**（连接探测）、**Edit**（编辑）、**Remove**（删除）。
- 页面底部显示正在编辑的补丁文件路径。

## 配置

插件自身在 loader 中的行配置支持一个可选字段：

| 字段 | 说明 |
|---|---|
| `patchFile` | 要编辑的用户补丁层绝对路径。默认 `$DSH_HOME/profiles/web/cordis.patch.yml`。 |

## 开发

```bash
pnpm install
pnpm typecheck   # tsc --noEmit；tsconfig paths 指向你的 DSH 安装目录下的 lib/types
pnpm build       # esbuild：lib/index.js（宿主端）+ lib/client.js（ModuleLoader 浏览器 bundle）
```

- `test/fixtures/mcp-test-server.mjs` 是一个最小化的 MCP stdio 服务器，用于端到端测试（`node test/fixtures/mcp-test-server.mjs`）。
- 开发时每次重建后，profile 的 client-modules 监听器会自动重新计算 `lib/client.js` 的 rev（见 `window.__DSH_BOOT__`），刷新页面即可生效；宿主端代码变更需要重载插件或重启应用。

### 已知行为

- 插件写入 `cordis.patch.yml` 时会规范化文件（js-yaml 往返）：条目会完整保留，但托管条目之外的注释不会被保留。文件头部注释已说明该文件由插件管理。
- 由 *bundle* 补丁层（而非用户补丁层）定义的 MCP 条目可以**停用**（通过用户层覆盖），但无法**删除**——删除仅对用户补丁层中的条目生效。

## 架构

- **宿主端**（`src/index.ts`）注册一个仅限 loopback 的 Connection RPC 通道 `/mcp-manager`，实现：`list`（遍历 `ctx.loader` 中的 `@deepseek-ai/dsh-mcp-client` 条目，并用 `ctx.tools` 统计工具数）、`add` / `remove` / `setEnabled` / `update`（编辑 profile 补丁层，持久化并经 HMR 应用）、`probe`（独立 MCP SDK 连接探测）、`patchInfo`。
- **浏览器端**（`src/client`）注册 设置 → MCP 页（`settings.section` 槽位，order 18），与宿主端仅通过 RPC 通道通信——浏览器端不直接访问文件系统。

## 许可证

MIT

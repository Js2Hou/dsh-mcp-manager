window.__ModuleLoader__.load({
	id: "@js2hou/dsh-mcp-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		"use strict";
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name in all)
		    __defProp(target, name, { get: all[name], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

		// src/client/index.tsx
		var index_exports = {};
		__export(index_exports, {
		  apply: () => apply,
		  inject: () => inject
		});
		module.exports = index_exports;

		// src/client/McpManagerSection.tsx
		var import_react = require("react");

		// src/shared.ts
		var RPC_CHANNEL = "/mcp-manager";

		// src/client/rpc.ts
		function connectionRpcOf(ctx) {
		  const connection = ctx.connection;
		  if (connection === void 0) {
		    throw new Error("connection service is unavailable (is @deepseek-ai/dsh-client-connection loaded?)");
		  }
		  return connection.rpc;
		}
		var McpManagerRpcError = class extends Error {
		  code;
		  fields;
		  constructor(error) {
		    super(`${error.code}: ${error.message}`);
		    this.name = "McpManagerRpcError";
		    this.code = error.code;
		    this.fields = error.details?.["fields"] ?? void 0;
		  }
		};
		async function callRpc(ctx, endpoint, payload) {
		  const raw = await connectionRpcOf(ctx).call(RPC_CHANNEL, endpoint, payload ?? null);
		  const result = raw;
		  if (result.ok) return result.value;
		  throw new McpManagerRpcError(result.error);
		}

		// src/client/locales.ts
		var NS = "mcpManager";
		var zh = {
		  nav: "MCP",
		  title: "MCP \u670D\u52A1\u5668",
		  total: "\u5171 {count} \u4E2A",
		  addServer: "\u6DFB\u52A0\u670D\u52A1\u5668",
		  connected: "{count} \u4E2A\u5DF2\u8FDE\u63A5",
		  failed: "{count} \u4E2A\u5931\u8D25",
		  enabledOf: "{count}/{total} \u5DF2\u542F\u7528",
		  refresh: "\u5237\u65B0",
		  loading: "\u6B63\u5728\u52A0\u8F7D\u670D\u52A1\u5668\u2026",
		  empty: "\u5C1A\u672A\u914D\u7F6E MCP \u670D\u52A1\u5668\u3002",
		  emptyHint: "\u70B9\u51FB\u201C\u6DFB\u52A0\u670D\u52A1\u5668\u201D\u5F00\u59CB\u63A5\u5165\u3002",
		  patchMissing: "\u8865\u4E01\u6587\u4EF6\u7F3A\u5931\uFF1A{path}",
		  removeConfirm: "\u5220\u9664 MCP \u670D\u52A1\u5668 \u201C{name}\u201D\uFF08{id}\uFF09\uFF1F\n\u6B64\u64CD\u4F5C\u4F1A\u4FEE\u6539 cordis.patch.yml \u5E76\u65AD\u5F00\u5176\u5DE5\u5177\u3002",
		  statusConnected: "\u5DF2\u8FDE\u63A5 \xB7 {count} \u4E2A\u5DE5\u5177",
		  statusActiveNoTools: "\u672A\u8FDE\u63A5 \xB7 \u65E0\u5DE5\u5177",
		  statusFailed: "\u5931\u8D25",
		  statusDisabled: "\u5DF2\u505C\u7528",
		  statusLoading: "\u52A0\u8F7D\u4E2D",
		  statusPending: "\u7B49\u5F85\u4E2D",
		  statusUnloading: "\u5378\u8F7D\u4E2D",
		  statusNotLoaded: "\u672A\u52A0\u8F7D",
		  toolCount: "{count} \u4E2A\u5DE5\u5177",
		  bundleDefined: "bundle \u5B9A\u4E49",
		  reconnectOff: "\u5DF2\u5173\u95ED\u91CD\u8FDE",
		  probeOk: "\u2713 \u5DF2\u8FDE\u63A5\uFF0C\u8017\u65F6 {ms}ms \xB7 {count} \u4E2A\u5DE5\u5177",
		  probeFail: "\u2717 {error}\uFF08{ms}ms\uFF09",
		  enable: "\u542F\u7528",
		  disable: "\u505C\u7528",
		  test: "\u6D4B\u8BD5",
		  edit: "\u7F16\u8F91",
		  remove: "\u5220\u9664",
		  formAddTitle: "\u6DFB\u52A0 MCP \u670D\u52A1\u5668",
		  formEditTitle: "\u7F16\u8F91 {name}",
		  fieldId: "\u6761\u76EE ID",
		  fieldServerName: "serverName",
		  fieldTransport: "\u4F20\u8F93\u65B9\u5F0F",
		  fieldUrl: "URL",
		  fieldCommand: "\u547D\u4EE4",
		  fieldArgs: "\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09",
		  fieldEnv: "\u73AF\u5883\u53D8\u91CF\uFF08KEY=VALUE\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
		  fieldCwd: "\u5DE5\u4F5C\u76EE\u5F55\uFF08\u53EF\u9009\uFF09",
		  fieldHeaders: "\u8BF7\u6C42\u5934\uFF08Key: Value\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
		  fieldTimeout: "toolCallTimeoutMs\uFF08\u53EF\u9009\uFF09",
		  fieldFailStartup: "failOnStartupError",
		  cancel: "\u53D6\u6D88",
		  save: "\u4FDD\u5B58\u66F4\u6539",
		  errIdRequired: "\u6761\u76EE ID \u5FC5\u586B",
		  errIdPattern: "\u9700\u5339\u914D [A-Za-z0-9_-]{1,64}",
		  errIdTaken: "\u6761\u76EE ID \u5DF2\u88AB\u5360\u7528",
		  errNameRequired: "serverName \u5FC5\u586B",
		  errNamePattern: "\u9700\u5339\u914D [A-Za-z0-9_-]{1,32}",
		  errNameTaken: "serverName \u5DF2\u88AB\u5360\u7528",
		  errUrlRequired: "URL \u5FC5\u586B",
		  errCommandRequired: "\u547D\u4EE4\u5FC5\u586B",
		  errDuplicateId: "\u6761\u76EE ID \u5DF2\u88AB\u4F7F\u7528",
		  errDuplicateName: "serverName \u5DF2\u88AB\u5176\u4ED6\u670D\u52A1\u5668\u4F7F\u7528",
		  errInvalidConfig: "MCP \u670D\u52A1\u5668\u914D\u7F6E\u65E0\u6548",
		  errNotFound: "\u672A\u627E\u5230\u8BE5 MCP \u670D\u52A1\u5668\u6761\u76EE",
		  errUnknown: "\u64CD\u4F5C\u5931\u8D25"
		};
		var en = {
		  nav: "MCP",
		  title: "MCP servers",
		  total: "{count} total",
		  addServer: "Add server",
		  connected: "{count} connected",
		  failed: "{count} failed",
		  enabledOf: "{count}/{total} enabled",
		  refresh: "Refresh",
		  loading: "Loading servers\u2026",
		  empty: "No MCP servers configured.",
		  emptyHint: "Use \u201CAdd server\u201D to connect one.",
		  patchMissing: "patch file missing: {path}",
		  removeConfirm: 'Remove MCP server "{name}" ({id})?\nThis edits cordis.patch.yml and disconnects its tools.',
		  statusConnected: "Connected \xB7 {count} tools",
		  statusActiveNoTools: "Not connected \xB7 no tools",
		  statusFailed: "Failed",
		  statusDisabled: "Disabled",
		  statusLoading: "Loading",
		  statusPending: "Pending",
		  statusUnloading: "Unloading",
		  statusNotLoaded: "Not loaded",
		  toolCount: "{count} tools",
		  bundleDefined: "bundle-defined",
		  reconnectOff: "reconnect off",
		  probeOk: "\u2713 Connected in {ms}ms \xB7 {count} tools",
		  probeFail: "\u2717 {error} ({ms}ms)",
		  enable: "Enable",
		  disable: "Disable",
		  test: "Test",
		  edit: "Edit",
		  remove: "Remove",
		  formAddTitle: "Add MCP server",
		  formEditTitle: "Edit {name}",
		  fieldId: "Entry id",
		  fieldServerName: "serverName",
		  fieldTransport: "Transport",
		  fieldUrl: "URL",
		  fieldCommand: "Command",
		  fieldArgs: "Args (one per line)",
		  fieldEnv: "Env (KEY=VALUE, one per line)",
		  fieldCwd: "Working directory (optional)",
		  fieldHeaders: "Headers (Key: Value, one per line)",
		  fieldTimeout: "toolCallTimeoutMs (optional)",
		  fieldFailStartup: "failOnStartupError",
		  cancel: "Cancel",
		  save: "Save changes",
		  errIdRequired: "Entry id is required",
		  errIdPattern: "Match [A-Za-z0-9_-]{1,64}",
		  errIdTaken: "Entry id already in use",
		  errNameRequired: "serverName is required",
		  errNamePattern: "Match [A-Za-z0-9_-]{1,32}",
		  errNameTaken: "serverName already in use",
		  errUrlRequired: "URL is required",
		  errCommandRequired: "Command is required",
		  errDuplicateId: "Entry id is already in use",
		  errDuplicateName: "serverName is already used by another server",
		  errInvalidConfig: "Invalid MCP server configuration",
		  errNotFound: "MCP server entry not found",
		  errUnknown: "Operation failed"
		};

		// src/client/icons.tsx
		var import_jsx_runtime = require("react/jsx-runtime");
		function base(size, className) {
		  return {
		    width: size ?? 16,
		    height: size ?? 16,
		    viewBox: "0 0 24 24",
		    fill: "none",
		    stroke: "currentColor",
		    strokeWidth: 2,
		    strokeLinecap: "round",
		    strokeLinejoin: "round",
		    className,
		    "aria-hidden": true
		  };
		}
		function ServerIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { ...base(size, className), children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "4", width: "18", height: "7", rx: "2" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "13", width: "18", height: "7", rx: "2" }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7 7.5h.01M7 16.5h.01" })
		  ] });
		}
		function PlusIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...base(size, className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 5v14M5 12h14" }) });
		}
		function TrashIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...base(size, className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" }) });
		}
		function EditIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...base(size, className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }) });
		}
		function RefreshIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...base(size, className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" }) });
		}
		function PlugIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...base(size, className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 22v-5M9 8V3M15 8V3M6 8h12v4a6 6 0 0 1-12 0Z" }) });
		}
		function PowerIcon({ size, className }) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { ...base(size, className), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0" }) });
		}

		// src/client/McpManagerSection.tsx
		var import_jsx_runtime2 = require("react/jsx-runtime");
		function errorMessage(error, t) {
		  if (error instanceof McpManagerRpcError) {
		    switch (error.code) {
		      case "duplicate-id":
		        return t("errDuplicateId");
		      case "duplicate-server-name":
		        return t("errDuplicateName");
		      case "invalid-config":
		        return t("errInvalidConfig");
		      case "not-found":
		        return t("errNotFound");
		      default:
		        return error.message.replace(/^[a-z-]+: /, "");
		    }
		  }
		  return error instanceof Error ? error.message : String(error);
		}
		function statusOf(server) {
		  if (!server.enabled) return { tone: "off", key: "statusDisabled" };
		  switch (server.fiberPhase) {
		    case "active":
		      return server.toolCount > 0 ? { tone: "ok", key: "statusConnected", count: String(server.toolCount) } : { tone: "warn", key: "statusActiveNoTools" };
		    case "failed":
		      return { tone: "bad", key: "statusFailed" };
		    case "loading":
		      return { tone: "warn", key: "statusLoading" };
		    case "pending":
		      return { tone: "warn", key: "statusPending" };
		    case "unloading":
		      return { tone: "warn", key: "statusUnloading" };
		    default:
		      return { tone: "off", key: "statusNotLoaded" };
		  }
		}
		function targetOf(server) {
		  if (server.transport === "stdio") {
		    return [server.command, ...server.args ?? []].filter(Boolean).join(" ");
		  }
		  return server.url ?? "";
		}
		function McpManagerSection({ ctx }) {
		  const t = ctx.locale.bind(NS);
		  const [, bump] = (0, import_react.useReducer)((x) => x + 1, 0);
		  (0, import_react.useEffect)(() => ctx.locale.subscribe(bump), [ctx]);
		  const [servers, setServers] = (0, import_react.useState)([]);
		  const [patchInfo, setPatchInfo] = (0, import_react.useState)(null);
		  const [loading, setLoading] = (0, import_react.useState)(true);
		  const [error, setError] = (0, import_react.useState)(null);
		  const [adding, setAdding] = (0, import_react.useState)(false);
		  const [editingId, setEditingId] = (0, import_react.useState)(null);
		  const [busy, setBusy] = (0, import_react.useState)(null);
		  const [probes, setProbes] = (0, import_react.useState)({});
		  const formOpen = adding || editingId !== null;
		  const actionsDisabled = busy !== null || formOpen;
		  const refresh = (0, import_react.useCallback)(async () => {
		    setLoading(true);
		    setError(null);
		    try {
		      const { servers: list } = await callRpc(ctx, "list");
		      setServers(list);
		      const { patch } = await callRpc(ctx, "patchInfo");
		      setPatchInfo(patch);
		    } catch (err) {
		      setError(errorMessage(err, t));
		    } finally {
		      setLoading(false);
		    }
		  }, [ctx, t]);
		  (0, import_react.useEffect)(() => {
		    void refresh();
		  }, [refresh]);
		  const refreshSettled = (0, import_react.useCallback)(() => {
		    void refresh();
		    window.setTimeout(() => {
		      void refresh();
		    }, 800);
		    window.setTimeout(() => {
		      void refresh();
		    }, 2400);
		  }, [refresh]);
		  const run = (0, import_react.useCallback)(async (action, label) => {
		    setBusy(label);
		    setError(null);
		    try {
		      await action();
		      refreshSettled();
		    } catch (err) {
		      setError(errorMessage(err, t));
		    } finally {
		      setBusy(null);
		    }
		  }, [refreshSettled, t]);
		  const toggleEnabled = (0, import_react.useCallback)((server) => {
		    void run(
		      () => callRpc(ctx, "setEnabled", { id: server.id, enabled: !server.enabled }),
		      `toggle:${server.id}`
		    );
		  }, [ctx, run]);
		  const removeServer = (0, import_react.useCallback)((server) => {
		    if (!window.confirm(t("removeConfirm", { name: server.serverName, id: server.id }))) return;
		    void run(() => callRpc(ctx, "remove", { id: server.id }), `remove:${server.id}`);
		  }, [ctx, run, t]);
		  const testConnection = (0, import_react.useCallback)((server) => {
		    void run(async () => {
		      const result = await callRpc(ctx, "probe", { id: server.id });
		      setProbes((prev) => ({ ...prev, [server.id]: result }));
		    }, `probe:${server.id}`);
		  }, [ctx, run]);
		  const beginAdd = (0, import_react.useCallback)(() => {
		    setEditingId(null);
		    setAdding(true);
		  }, []);
		  const closeForms = (0, import_react.useCallback)(() => {
		    setAdding(false);
		    setEditingId(null);
		  }, []);
		  const beginEdit = (0, import_react.useCallback)((server) => {
		    setAdding(false);
		    setEditingId(server.id);
		  }, []);
		  const summary = (0, import_react.useMemo)(() => {
		    const enabled = servers.filter((s) => s.enabled).length;
		    const connected = servers.filter((s) => s.enabled && s.fiberPhase === "active" && s.toolCount > 0).length;
		    const failed = servers.filter((s) => s.enabled && s.fiberPhase === "failed").length;
		    return { total: servers.length, enabled, connected, failed };
		  }, [servers]);
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-section", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-head", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshmcp-head-title", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ServerIcon, { size: 15 }),
		        t("title"),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-head-sub", children: t("total", { count: String(summary.total) }) })
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshmcp-iconbtn", title: t("refresh"), onClick: () => void refresh(), disabled: actionsDisabled || loading, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RefreshIcon, { size: 14 }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-toolbar", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		        "button",
		        {
		          type: "button",
		          className: "dshmcp-btn dshmcp-btn-primary dshmcp-btn-sm",
		          onClick: beginAdd,
		          disabled: actionsDisabled,
		          title: editingId !== null ? t("formEditTitle", { name: servers.find((s) => s.id === editingId)?.serverName ?? editingId }) : void 0,
		          children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PlusIcon, { size: 12 }),
		            " ",
		            t("addServer")
		          ]
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spacer" }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dshmcp-meta", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("connected", { count: String(summary.connected) }) }),
		        summary.failed > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-probe-bad", children: t("failed", { count: String(summary.failed) }) }) : null,
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("enabledOf", { count: String(summary.enabled), total: String(summary.total) }) })
		      ] })
		    ] }),
		    error !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-error", children: error }) : null,
		    adding ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		      ServerForm,
		      {
		        ctx,
		        t,
		        initial: void 0,
		        existingIds: new Set(servers.map((s) => s.id)),
		        existingNames: new Set(servers.map((s) => s.serverName)),
		        busy: busy !== null,
		        onCancel: closeForms,
		        onSaved: () => {
		          closeForms();
		          void run(() => Promise.resolve(), "form:add");
		        }
		      }
		    ) : null,
		    loading && servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-empty", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spin" }),
		      " ",
		      t("loading")
		    ] }) : null,
		    !loading && servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-empty", children: [
		      t("empty"),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
		      t("emptyHint")
		    ] }) : null,
		    servers.map((server) => {
		      if (server.id === editingId) {
		        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          ServerForm,
		          {
		            ctx,
		            t,
		            initial: server,
		            existingIds: new Set(servers.map((s) => s.id)),
		            existingNames: new Set(servers.map((s) => s.serverName)),
		            busy: busy !== null,
		            onCancel: closeForms,
		            onSaved: () => {
		              closeForms();
		              void run(() => Promise.resolve(), `form:update:${server.id}`);
		            }
		          },
		          server.id
		        );
		      }
		      const status = statusOf(server);
		      const probe = probes[server.id];
		      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-card", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-card-head", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: `dshmcp-status dshmcp-status-${status.tone}`, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-status-dot" }),
		            t(status.key, status.count !== void 0 ? { count: status.count } : void 0)
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spacer" }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-id", title: server.id, children: server.id })
		        ] }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-name", children: server.serverName || "(unnamed)" }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-target", title: targetOf(server), children: targetOf(server) || (server.transport === "stdio" ? "stdio" : server.url ?? "streamable-http") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-meta", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: server.transport }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("toolCount", { count: String(server.toolCount) }) }),
		          !server.userManaged ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("bundleDefined") }) : null,
		          server.failOnStartupError === true ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "failOnStartupError" }) : null,
		          server.reconnect?.enabled === false ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("reconnectOff") }) : null
		        ] }),
		        probe !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `dshmcp-probe ${probe.ok ? "dshmcp-probe-ok" : "dshmcp-probe-bad"}`, children: probe.ok ? t("probeOk", {
		          ms: String(probe.latencyMs),
		          count: probe.toolCount !== void 0 ? String(probe.toolCount) : "?"
		        }) : t("probeFail", { error: probe.error ?? "failed", ms: String(probe.latencyMs) }) }) : null,
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-actions", children: [
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshmcp-btn dshmcp-btn-sm", onClick: () => toggleEnabled(server), disabled: actionsDisabled, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PowerIcon, { size: 12 }),
		            " ",
		            server.enabled ? t("disable") : t("enable")
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshmcp-btn dshmcp-btn-sm", onClick: () => testConnection(server), disabled: actionsDisabled, children: [
		            busy === `probe:${server.id}` ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PlugIcon, { size: 12 }),
		            " ",
		            t("test")
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshmcp-btn dshmcp-btn-sm", onClick: () => beginEdit(server), disabled: actionsDisabled, children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(EditIcon, { size: 12 }),
		            " ",
		            t("edit")
		          ] }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spacer" }),
		          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		            "button",
		            {
		              type: "button",
		              className: "dshmcp-btn dshmcp-btn-sm dshmcp-btn-danger",
		              onClick: () => removeServer(server),
		              disabled: actionsDisabled,
		              title: server.userManaged ? t("remove") : t("bundleDefined"),
		              children: [
		                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TrashIcon, { size: 12 }),
		                " ",
		                t("remove")
		              ]
		            }
		          )
		        ] })
		      ] }, server.id);
		    }),
		    patchInfo !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-footer", title: patchInfo.path, children: patchInfo.exists ? patchInfo.path : t("patchMissing", { path: patchInfo.path }) }) : null
		  ] });
		}
		var EMPTY_FORM = {
		  id: "",
		  serverName: "",
		  transport: "streamable-http",
		  url: "",
		  command: "",
		  argsText: "",
		  envText: "",
		  cwd: "",
		  headersText: "",
		  toolCallTimeoutMs: "",
		  failOnStartupError: false
		};
		function toForm(server) {
		  if (server === void 0) return EMPTY_FORM;
		  return {
		    id: server.id,
		    serverName: server.serverName,
		    transport: server.transport,
		    url: server.url ?? "",
		    command: server.command ?? "",
		    argsText: (server.args ?? []).join("\n"),
		    envText: (server.env !== void 0 ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`) : []).join("\n"),
		    cwd: server.cwd ?? "",
		    headersText: (server.headers !== void 0 ? Object.entries(server.headers).map(([k, v]) => `${k}: ${v}`) : []).join("\n"),
		    toolCallTimeoutMs: server.toolCallTimeoutMs !== void 0 ? String(server.toolCallTimeoutMs) : "",
		    failOnStartupError: server.failOnStartupError === true
		  };
		}
		function splitLines(text) {
		  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
		}
		function stripQuotes(value) {
		  const trimmed = value.trim();
		  if (trimmed.length >= 2) {
		    const first = trimmed[0];
		    const last = trimmed[trimmed.length - 1];
		    if (first === '"' && last === '"' || first === "'" && last === "'") {
		      return trimmed.slice(1, -1).trim();
		    }
		  }
		  return trimmed;
		}
		function parsePairs(text) {
		  const lines = splitLines(text);
		  if (lines.length === 0) return void 0;
		  const out = {};
		  for (const line of lines) {
		    const eq = line.indexOf("=");
		    const colon = line.indexOf(":");
		    const sep = eq === -1 ? colon : colon === -1 ? eq : Math.min(eq, colon);
		    if (sep <= 0) continue;
		    out[stripQuotes(line.slice(0, sep))] = stripQuotes(line.slice(sep + 1));
		  }
		  return out;
		}
		function toConfig(form) {
		  const config = {
		    serverName: form.serverName.trim(),
		    transport: form.transport
		  };
		  if (form.transport === "streamable-http") {
		    if (form.url.trim() !== "") config.url = form.url.trim();
		  } else {
		    if (form.command.trim() !== "") config.command = form.command.trim();
		    const args = splitLines(form.argsText);
		    if (args.length > 0) config.args = args;
		    const env = parsePairs(form.envText);
		    if (env !== void 0) config.env = env;
		    if (form.cwd.trim() !== "") config.cwd = form.cwd.trim();
		  }
		  const headers = parsePairs(form.headersText);
		  if (headers !== void 0) config.headers = headers;
		  if (form.toolCallTimeoutMs.trim() !== "" && Number.isFinite(Number(form.toolCallTimeoutMs))) {
		    config.toolCallTimeoutMs = Number(form.toolCallTimeoutMs);
		  }
		  if (form.failOnStartupError) config.failOnStartupError = true;
		  return config;
		}
		function ServerForm({ ctx, t, initial, existingIds, existingNames, busy, onCancel, onSaved }) {
		  const editing = initial !== void 0;
		  const [form, setForm] = (0, import_react.useState)(() => toForm(initial));
		  const [fieldErrors, setFieldErrors] = (0, import_react.useState)({});
		  const [submitError, setSubmitError] = (0, import_react.useState)(null);
		  const [saving, setSaving] = (0, import_react.useState)(false);
		  const set = (key, value) => {
		    setForm((prev) => ({ ...prev, [key]: value }));
		  };
		  const validateLocal = () => {
		    const errors = {};
		    if (form.id.trim() === "") errors["id"] = t("errIdRequired");
		    else if (!/^[A-Za-z0-9_-]{1,64}$/.test(form.id.trim())) errors["id"] = t("errIdPattern");
		    else if (!editing && existingIds.has(form.id.trim())) errors["id"] = t("errIdTaken");
		    if (form.serverName.trim() === "") errors["serverName"] = t("errNameRequired");
		    else if (!/^[A-Za-z0-9_-]{1,32}$/.test(form.serverName.trim())) errors["serverName"] = t("errNamePattern");
		    else if (!editing && existingNames.has(form.serverName.trim())) errors["serverName"] = t("errNameTaken");
		    if (form.transport === "streamable-http" && form.url.trim() === "") errors["url"] = t("errUrlRequired");
		    if (form.transport === "stdio" && form.command.trim() === "") errors["command"] = t("errCommandRequired");
		    return errors;
		  };
		  const submit = async () => {
		    const local = validateLocal();
		    setFieldErrors(local);
		    if (Object.keys(local).length > 0) return;
		    setSaving(true);
		    setSubmitError(null);
		    try {
		      const payload = { id: form.id.trim(), config: toConfig(form) };
		      if (editing) {
		        await callRpc(ctx, "update", payload);
		      } else {
		        await callRpc(ctx, "add", payload);
		      }
		      onSaved();
		    } catch (err2) {
		      if (err2 instanceof McpManagerRpcError && err2.fields !== void 0) setFieldErrors(err2.fields);
		      setSubmitError(errorMessage(err2, t));
		    } finally {
		      setSaving(false);
		    }
		  };
		  const err = (key) => fieldErrors[key];
		  const inputClass = (key) => `dshmcp-input${err(key) !== void 0 ? " dshmcp-input-invalid" : ""}`;
		  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-form", children: [
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-form-title", children: editing ? t("formEditTitle", { name: initial.serverName }) : t("formAddTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field-row", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-id", children: t("fieldId") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            id: "dshmcp-id",
		            className: inputClass("id"),
		            value: form.id,
		            placeholder: "mcp-github",
		            spellCheck: false,
		            disabled: editing || saving || busy,
		            onChange: (e) => set("id", e.target.value)
		          }
		        ),
		        err("id") !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dshmcp-hint", children: err("id") }) : null
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-server", children: t("fieldServerName") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            id: "dshmcp-server",
		            className: inputClass("serverName"),
		            value: form.serverName,
		            placeholder: "github",
		            spellCheck: false,
		            disabled: saving || busy,
		            onChange: (e) => set("serverName", e.target.value)
		          }
		        ),
		        err("serverName") !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dshmcp-hint", children: err("serverName") }) : null
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-transport", children: t("fieldTransport") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
		        "select",
		        {
		          id: "dshmcp-transport",
		          className: "dshmcp-select",
		          value: form.transport,
		          disabled: saving || busy,
		          onChange: (e) => set("transport", e.target.value),
		          children: [
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "streamable-http", children: "streamable-http" }),
		            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "stdio", children: "stdio" })
		          ]
		        }
		      )
		    ] }),
		    form.transport === "streamable-http" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-url", children: t("fieldUrl") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		        "input",
		        {
		          id: "dshmcp-url",
		          className: inputClass("url"),
		          value: form.url,
		          placeholder: "http://127.0.0.1:3000/mcp",
		          spellCheck: false,
		          disabled: saving || busy,
		          onChange: (e) => set("url", e.target.value)
		        }
		      ),
		      err("url") !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dshmcp-hint", children: err("url") }) : null
		    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-command", children: t("fieldCommand") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            id: "dshmcp-command",
		            className: inputClass("command"),
		            value: form.command,
		            placeholder: "npx",
		            spellCheck: false,
		            disabled: saving || busy,
		            onChange: (e) => set("command", e.target.value)
		          }
		        ),
		        err("command") !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dshmcp-hint", children: err("command") }) : null
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-args", children: t("fieldArgs") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "textarea",
		          {
		            id: "dshmcp-args",
		            className: "dshmcp-input",
		            rows: 3,
		            value: form.argsText,
		            placeholder: "-y\n@modelcontextprotocol/server-github",
		            spellCheck: false,
		            disabled: saving || busy,
		            onChange: (e) => set("argsText", e.target.value)
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-env", children: t("fieldEnv") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "textarea",
		          {
		            id: "dshmcp-env",
		            className: "dshmcp-input",
		            rows: 3,
		            value: form.envText,
		            placeholder: "GITHUB_TOKEN=ghp_xxx",
		            spellCheck: false,
		            disabled: saving || busy,
		            onChange: (e) => set("envText", e.target.value)
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-cwd", children: t("fieldCwd") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            id: "dshmcp-cwd",
		            className: "dshmcp-input",
		            value: form.cwd,
		            spellCheck: false,
		            disabled: saving || busy,
		            onChange: (e) => set("cwd", e.target.value)
		          }
		        )
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-headers", children: t("fieldHeaders") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		        "textarea",
		        {
		          id: "dshmcp-headers",
		          className: "dshmcp-input",
		          rows: 2,
		          value: form.headersText,
		          placeholder: "Authorization: Bearer xxx",
		          spellCheck: false,
		          disabled: saving || busy,
		          onChange: (e) => set("headersText", e.target.value)
		        }
		      )
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field-row", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-field", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "dshmcp-label", htmlFor: "dshmcp-timeout", children: t("fieldTimeout") }),
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            id: "dshmcp-timeout",
		            className: "dshmcp-input",
		            value: form.toolCallTimeoutMs,
		            inputMode: "numeric",
		            placeholder: "60000",
		            disabled: saving || busy,
		            onChange: (e) => set("toolCallTimeoutMs", e.target.value.replace(/[^0-9]/g, ""))
		          }
		        )
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-field", style: { justifyContent: "flex-end" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dshmcp-check", children: [
		        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
		          "input",
		          {
		            type: "checkbox",
		            checked: form.failOnStartupError,
		            disabled: saving || busy,
		            onChange: (e) => set("failOnStartupError", e.target.checked)
		          }
		        ),
		        t("fieldFailStartup")
		      ] }) })
		    ] }),
		    submitError !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshmcp-error", children: submitError }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshmcp-form-actions", children: [
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dshmcp-btn dshmcp-btn-sm", onClick: onCancel, disabled: saving, children: t("cancel") }),
		      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "dshmcp-btn dshmcp-btn-sm dshmcp-btn-primary", onClick: () => void submit(), disabled: saving || busy, children: [
		        saving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dshmcp-spin" }) : null,
		        " ",
		        editing ? t("save") : t("addServer")
		      ] })
		    ] })
		  ] });
		}

		// src/client/styles.ts
		var STYLE_ID = "dsh-mcp-manager-styles";
		var CSS = `
		.dshmcp-section{max-width:720px;width:100%;display:flex;flex-direction:column;gap:14px;color:var(--dsw-alias-label-primary,#e6e8eb);font:13px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}
		.dshmcp-head{display:flex;align-items:center;gap:10px}
		.dshmcp-head-title{font-size:16px;font-weight:600;flex:1;min-width:0;display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary,#e6e8eb)}
		.dshmcp-head-sub{color:var(--dsw-alias-label-tertiary,#8b919c);font-size:12px;font-weight:400}
		.dshmcp-toolbar{display:flex;gap:10px;align-items:center}
		.dshmcp-btn{appearance:none;font:inherit;border:1px solid var(--dsw-alias-border-l2,#2b2f38);border-radius:8px;padding:6px 14px;
		  background:var(--dsw-alias-bg-layer-3,#22262e);color:var(--dsw-alias-label-primary,#e6e8eb);cursor:pointer;line-height:1.45;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
		.dshmcp-btn:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed,#4a505c)}
		.dshmcp-btn:disabled{opacity:.45;cursor:default}
		.dshmcp-btn-primary{background:var(--dsw-alias-brand-primary,#4f8cff);border-color:transparent;color:#fff}
		.dshmcp-btn-danger{color:var(--dsw-alias-label-error,#ff6b6b)}
		.dshmcp-btn-sm{padding:4px 10px;font-size:12px;border-radius:7px;gap:5px}
		.dshmcp-iconbtn{appearance:none;font:inherit;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#a7adb8);cursor:pointer;padding:5px 7px;display:inline-flex;align-items:center}
		.dshmcp-iconbtn:hover:not(:disabled){background:var(--dsw-alias-bg-module-platform,#262b34);color:var(--dsw-alias-label-primary,#e6e8eb)}
		.dshmcp-iconbtn:disabled{opacity:.4;cursor:default}
		.dshmcp-empty{color:var(--dsw-alias-label-tertiary,#8b919c);text-align:center;padding:40px 16px;font-size:13px}
		.dshmcp-card{border:1px solid var(--dsw-alias-border-l2,#2b2f38);background:var(--dsw-alias-bg-layer-3,#22262e);border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,background .15s}
		.dshmcp-card:hover{border-color:var(--dsw-alias-label-dimmed,#4a505c)}
		.dshmcp-card-head{display:flex;align-items:center;gap:10px}
		.dshmcp-status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;line-height:18px}
		.dshmcp-status-dot{width:7px;height:7px;border-radius:50%;background:currentColor}
		.dshmcp-status-ok{background:rgba(63,185,80,.14);color:#3fb950}
		.dshmcp-status-warn{background:rgba(210,153,34,.14);color:#d29922}
		.dshmcp-status-bad{background:rgba(248,81,73,.14);color:#f85149}
		.dshmcp-status-off{background:var(--dsw-alias-bg-module-platform,#262b34);color:var(--dsw-alias-label-secondary,#a7adb8)}
		.dshmcp-id{color:var(--dsw-alias-label-tertiary,#8b919c);font-size:12px;font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.dshmcp-name{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary,#e6e8eb)}
		.dshmcp-target{color:var(--dsw-alias-label-secondary,#a7adb8);font-size:12.5px;font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
		.dshmcp-meta{display:flex;gap:14px;flex-wrap:wrap;color:var(--dsw-alias-label-tertiary,#8b919c);font-size:12px}
		.dshmcp-probe{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#8b919c);max-width:100%;overflow-wrap:anywhere}
		.dshmcp-probe-ok{color:#3fb950}
		.dshmcp-probe-bad{color:var(--dsw-alias-label-error,#ff6b6b)}
		.dshmcp-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l2,#2b2f38);padding-top:10px;margin-top:2px}
		.dshmcp-form{display:flex;flex-direction:column;gap:10px;padding:18px;border:1px solid var(--dsw-alias-border-l2,#2b2f38);border-radius:14px;background:var(--dsw-alias-bg-layer-3,#22262e)}
		.dshmcp-form-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary,#e6e8eb);margin-bottom:2px}
		.dshmcp-field{display:flex;flex-direction:column;gap:5px}
		.dshmcp-label{font-size:12px;color:var(--dsw-alias-label-secondary,#a7adb8)}
		.dshmcp-input{border:1px solid var(--dsw-alias-border-l2,#2b2f38);background:var(--dsw-alias-bg-layer-3,#22262e);color:var(--dsw-alias-label-primary,#e6e8eb);border-radius:8px;padding:7px 11px;font:inherit;font-size:13px}
		.dshmcp-input:focus-visible{border-color:var(--dsw-alias-brand-primary,#4f8cff);outline:none}
		.dshmcp-input-invalid{border-color:var(--dsw-alias-label-error,#ff6b6b)}
		.dshmcp-select{border:1px solid var(--dsw-alias-border-l2,#2b2f38);background:var(--dsw-alias-bg-layer-3,#22262e);color:var(--dsw-alias-label-primary,#e6e8eb);border-radius:8px;padding:7px 11px;font:inherit;font-size:13px}
		.dshmcp-hint{color:var(--dsw-alias-label-error,#ff6b6b);font-size:12px;margin:0}
		.dshmcp-field-row{display:flex;gap:10px}
		.dshmcp-field-row .dshmcp-field{flex:1}
		.dshmcp-check{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-secondary,#a7adb8);cursor:pointer}
		.dshmcp-form-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}
		.dshmcp-error{color:var(--dsw-alias-label-error,#ff6b6b);font-size:12px;padding:8px 12px;border:1px solid rgba(248,81,73,.35);border-radius:9px;background:rgba(248,81,73,.08)}
		.dshmcp-footer{color:var(--dsw-alias-label-tertiary,#8b919c);font-size:11.5px;font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-top:2px}
		.dshmcp-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--dsw-alias-label-dimmed,#4a505c);border-top-color:transparent;border-radius:50%;animation:dshmcp-spin .8s linear infinite;vertical-align:-2px}
		@keyframes dshmcp-spin{to{transform:rotate(360deg)}}
		`;
		function injectPanelStyles() {
		  if (document.getElementById(STYLE_ID) !== null) return;
		  const style = document.createElement("style");
		  style.id = STYLE_ID;
		  style.textContent = CSS;
		  document.head.appendChild(style);
		}

		// src/client/index.tsx
		var inject = ["slots", "connection", "locale"];
		var SECTION_ORDER = 18;
		function apply(ctx) {
		  ctx.effect(() => {
		    injectPanelStyles();
		    return () => {
		    };
		  }, "mcp-manager: styles");
		  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "mcp-manager: locale");
		  const t = ctx.locale.bind(NS);
		  ctx.slots.inject("settings.section", () => ctx.slots.register({
		    name: "settings.section",
		    id: "mcp",
		    order: SECTION_ORDER,
		    label: () => t("nav"),
		    inject: () => ({ ctx })
		  }, McpManagerSection));
		}
		//# sourceMappingURL=client.js.map


		return module.exports;
	}
});

//# sourceMappingURL=client.js.map

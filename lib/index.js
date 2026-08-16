// src/index.ts
import { existsSync as existsSync2 } from "node:fs";

// src/shared.ts
var MCP_CLIENT_PACKAGE = "@deepseek-ai/dsh-mcp-client";
var RPC_CHANNEL = "/mcp-manager";

// src/patch.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as yaml from "js-yaml";
function isJsExpr(value) {
  return value instanceof Object && "__jsExpr" in value;
}
function resolveDshHome(configured) {
  if (configured !== void 0 && configured.trim() !== "") return configured.trim();
  const env = process.env["DSH_HOME"];
  if (env !== void 0 && env.trim() !== "") return env.trim();
  return join(homedir(), ".dsh");
}
var JsExprType = new yaml.Type("tag:yaml.org,2002:js", {
  kind: "scalar",
  resolve: (data) => typeof data === "string",
  construct: (data) => ({ __jsExpr: data }),
  predicate: isJsExpr,
  represent: (data) => data["__jsExpr"]
});
var ENTRY_LIST_SCHEMA = yaml.JSON_SCHEMA.extend(JsExprType);
var PATCH_HEADER = `# MCP servers managed by the dsh-mcp-manager plugin.
# Format: a top-level YAML array of loader patch entries (\`!!js\` expressions
# allowed). Edit here, or use the MCP Manager panel in the web GUI.
`;
function resolvePatchPath(configured) {
  if (configured !== void 0 && configured.trim() !== "") return configured.trim();
  return join(resolveDshHome(), "profiles", "web", "cordis.patch.yml");
}
function readPatchList(file) {
  if (!existsSync(file)) return [];
  const content = readFileSync(file, "utf8");
  const trimmed = content.trim();
  if (trimmed === "") return [];
  const parsed = yaml.load(content, { schema: ENTRY_LIST_SCHEMA });
  if (parsed === void 0 || parsed === null) return [];
  if (!Array.isArray(parsed)) throw new Error(`patch file ${file} must be a top-level array`);
  return parsed;
}
function writePatchList(file, rows) {
  const body = rows.length > 0 ? yaml.dump(rows, { schema: ENTRY_LIST_SCHEMA, lineWidth: 120 }) : "[]\n";
  writeFileSync(file, `${PATCH_HEADER}${body}`, "utf8");
}
function editPatchList(file, edit) {
  const next = edit(readPatchList(file));
  writePatchList(file, next);
  return next;
}
function patchHasId(rows, id) {
  return rows.some(
    (row) => row.id === id || Array.isArray(row.insert) && row.insert.some((item) => item["id"] === id)
  );
}
function locate(rows, id) {
  for (const row of rows) {
    if (row.id === id) return { kind: "row", row };
    if (Array.isArray(row.insert)) {
      const item = row.insert.find((entry) => entry["id"] === id);
      if (item !== void 0) return { kind: "insert", row, item };
    }
  }
  return void 0;
}
function addMcpRow(rows, id, config) {
  return [
    ...rows,
    { insert: [{ id, name: "@deepseek-ai/dsh-mcp-client", config }] }
  ];
}
function removeMcpRow(rows, id) {
  const next = [];
  for (const row of rows) {
    if (row.id === id) continue;
    if (Array.isArray(row.insert)) {
      const filtered = row.insert.filter((item) => item["id"] !== id);
      if (filtered.length === 0) continue;
      next.push({ ...row, insert: filtered });
      continue;
    }
    next.push(row);
  }
  return next;
}
function setMcpEnabled(rows, id, enabled) {
  const found = locate(rows, id);
  if (found === void 0) {
    return [...rows, { id, name: "@deepseek-ai/dsh-mcp-client", disabled: !enabled }];
  }
  if (found.kind === "row") {
    return rows.map(
      (row) => row === found.row ? { ...row, disabled: enabled ? false : true } : row
    );
  }
  const item = found.item;
  return rows.map(
    (row) => row === found.row ? {
      ...row,
      insert: row.insert.map(
        (entry) => entry === item ? { ...entry, disabled: enabled ? false : true } : entry
      )
    } : row
  );
}
function updateMcpConfig(rows, id, config) {
  const found = locate(rows, id);
  if (found === void 0) {
    return [...rows, { id, name: "@deepseek-ai/dsh-mcp-client", config }];
  }
  if (found.kind === "row") {
    return rows.map((row) => row === found.row ? { ...row, config } : row);
  }
  const item = found.item;
  return rows.map(
    (row) => row === found.row ? {
      ...row,
      insert: row.insert.map(
        (entry) => entry === item ? { ...entry, config } : entry
      )
    } : row
  );
}
function isUserManaged(rows, id) {
  return patchHasId(rows, id);
}

// src/status.ts
var FIBER_STATE = {
  PENDING: 0,
  LOADING: 1,
  ACTIVE: 2,
  FAILED: 3,
  DISPOSED: 4,
  UNLOADING: 5
};
function normalizeEntryId(id) {
  return id.startsWith("include:") ? id.slice("include:".length) : id;
}
var FIBER_PHASE = {
  [FIBER_STATE.PENDING]: "pending",
  [FIBER_STATE.LOADING]: "loading",
  [FIBER_STATE.ACTIVE]: "active",
  [FIBER_STATE.FAILED]: "failed",
  [FIBER_STATE.DISPOSED]: null,
  [FIBER_STATE.UNLOADING]: "unloading"
};
function toServerConfig(raw) {
  const cfg = raw ?? {};
  return {
    serverName: typeof cfg["serverName"] === "string" ? cfg["serverName"] : "",
    transport: cfg["transport"] === "stdio" ? "stdio" : "streamable-http",
    url: typeof cfg["url"] === "string" ? cfg["url"] : void 0,
    command: typeof cfg["command"] === "string" ? cfg["command"] : void 0,
    args: Array.isArray(cfg["args"]) ? cfg["args"] : void 0,
    env: isRecord(cfg["env"]) ? cfg["env"] : void 0,
    cwd: typeof cfg["cwd"] === "string" ? cfg["cwd"] : void 0,
    headers: isRecord(cfg["headers"]) ? cfg["headers"] : void 0,
    toolCallTimeoutMs: typeof cfg["toolCallTimeoutMs"] === "number" ? cfg["toolCallTimeoutMs"] : void 0,
    failOnStartupError: typeof cfg["failOnStartupError"] === "boolean" ? cfg["failOnStartupError"] : void 0,
    reconnect: isRecord(cfg["reconnect"]) ? cfg["reconnect"] : void 0
  };
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function countServerTools(ctx, serverName) {
  if (serverName === "") return 0;
  const prefix = `mcp__${serverName}__`;
  let count = 0;
  for (const schema of ctx.tools.schemas()) {
    if (schema.name.startsWith(prefix)) count += 1;
  }
  return count;
}
function listMcpServers(ctx, userManaged) {
  const servers = [];
  for (const entry of ctx.loader.entries()) {
    if (entry.options.group) continue;
    if (entry.options.name !== MCP_CLIENT_PACKAGE) continue;
    const config = toServerConfig(entry.options.config);
    const phase = entry.fiber === void 0 ? null : FIBER_PHASE[entry.fiber.state] ?? null;
    const id = normalizeEntryId(entry.id);
    servers.push({
      ...config,
      id,
      enabled: !entry.disabled,
      fiberPhase: phase,
      toolCount: countServerTools(ctx, config.serverName),
      userManaged: userManaged(id)
    });
  }
  return servers;
}
function serverNameTaken(ctx, serverName, exceptId) {
  for (const entry of ctx.loader.entries()) {
    if (entry.options.group) continue;
    if (entry.options.name !== MCP_CLIENT_PACKAGE) continue;
    if (exceptId !== void 0 && normalizeEntryId(entry.id) === exceptId) continue;
    const raw = entry.options.config ?? {};
    if (raw["serverName"] === serverName) return true;
  }
  return false;
}
function entryIdTaken(ctx, id, exceptId) {
  for (const entry of ctx.loader.entries()) {
    if (normalizeEntryId(entry.id) === id && entry.id !== exceptId) return true;
  }
  return false;
}

// src/probe.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
var PROBE_TIMEOUT_MS = 8e3;
async function probeServer(config, timeoutMs = PROBE_TIMEOUT_MS) {
  const started = Date.now();
  const client = new Client(
    { name: "dsh-mcp-manager-probe", version: "0.1.0" },
    { capabilities: {} }
  );
  let transport;
  const finish = (result) => ({ ...result, latencyMs: Date.now() - started });
  const withTimeout = (promise) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`probe timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
  try {
    if (config.transport === "stdio") {
      transport = new StdioClientTransport({
        command: config.command ?? "",
        args: config.args,
        env: { ...config.env ?? {} },
        cwd: config.cwd
      });
    } else {
      transport = new StreamableHTTPClientTransport(
        new URL(config.url ?? ""),
        { requestInit: { headers: config.headers ?? {} } }
      );
    }
    await withTimeout(client.connect(transport));
    const tools = await withTimeout(client.listTools());
    const toolCount = Array.isArray(tools?.tools) ? tools.tools.length : 0;
    return finish({ ok: true, toolCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return finish({ ok: false, error: message });
  } finally {
    try {
      await client.close();
    } catch {
    }
  }
}

// src/validate.ts
var SERVER_NAME_RE = /^[A-Za-z0-9_-]{1,32}$/;
var ENTRY_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
function validateMcpConfig(id, config) {
  const errors = {};
  if (!ENTRY_ID_RE.test(id)) {
    errors["id"] = "Entry id must match [A-Za-z0-9_-]{1,64}";
  }
  if (typeof config.serverName !== "string" || !SERVER_NAME_RE.test(config.serverName)) {
    errors["serverName"] = "serverName must match [A-Za-z0-9_-]{1,32}";
  }
  const transport = config.transport === "stdio" ? "stdio" : "streamable-http";
  if (transport === "streamable-http") {
    if (typeof config.url !== "string" || !/^https?:\/\/.+/.test(config.url)) {
      errors["url"] = "A valid http(s):// URL is required for streamable-http";
    }
  } else {
    if (typeof config.command !== "string" || config.command.trim() === "") {
      errors["command"] = "An executable command is required for stdio";
    }
    if (config.args !== void 0 && !Array.isArray(config.args)) {
      errors["args"] = "args must be an array of strings";
    }
    if (config.cwd !== void 0 && typeof config.cwd !== "string") {
      errors["cwd"] = "cwd must be a string";
    }
  }
  if (config.env !== void 0 && !isStringRecord(config.env)) {
    errors["env"] = "env must be a string-to-string map";
  }
  if (config.headers !== void 0 && !isStringRecord(config.headers)) {
    errors["headers"] = "headers must be a string-to-string map";
  }
  if (config.toolCallTimeoutMs !== void 0 && (typeof config.toolCallTimeoutMs !== "number" || config.toolCallTimeoutMs < 1)) {
    errors["toolCallTimeoutMs"] = "toolCallTimeoutMs must be a positive number";
  }
  return errors;
}
function isStringRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === "string");
}

// src/index.ts
var name = "mcp-manager";
var inject = ["connection", "loader", "tools"];
function ok(value) {
  return { ok: true, value };
}
function fail(code, message, details = {}) {
  return { ok: false, error: { code, message, details } };
}
function apply(ctx, rawConfig) {
  const patchFile = resolvePatchPath(rawConfig?.patchFile);
  const logger = ctx.logger("mcp-manager");
  ctx.effect(() => {
    const handler = (async (endpoint, payload) => dispatch(ctx, patchFile, endpoint, payload));
    const dispose = ctx.connection.rpc.handle(
      RPC_CHANNEL,
      handler,
      { authority: "loopback" }
    );
    return () => {
      void dispose();
    };
  }, "mcp-manager: rpc channel");
  logger.info("mcp-manager active (patch file: %s)", patchFile);
}
async function dispatch(ctx, patchFile, endpoint, payload) {
  switch (endpoint) {
    case "list": {
      const rows = readPatchList(patchFile);
      const servers = listMcpServers(ctx, (id) => isUserManaged(rows, id));
      return ok({ servers });
    }
    case "patchInfo": {
      return ok({ patch: { path: patchFile, exists: existsSync2(patchFile) } });
    }
    case "add": {
      const { id, config } = payload;
      const errors = validateMcpConfig(id, config);
      if (Object.keys(errors).length > 0) {
        return operationError("invalid-config", "Invalid MCP server configuration", errors);
      }
      if (entryIdTaken(ctx, id)) {
        return operationError("duplicate-id", `Entry id "${id}" is already in use`);
      }
      if (serverNameTaken(ctx, config.serverName)) {
        return operationError(
          "duplicate-server-name",
          `serverName "${config.serverName}" is already used by another MCP server`
        );
      }
      editPatchList(patchFile, (rows) => addMcpRow(rows, id, config));
      return ok({ added: id });
    }
    case "remove": {
      const { id } = payload;
      editPatchList(patchFile, (rows) => removeMcpRow(rows, id));
      return ok({ removed: id });
    }
    case "setEnabled": {
      const { id, enabled } = payload;
      editPatchList(patchFile, (rows) => setMcpEnabled(rows, id, enabled === true));
      return ok({ id, enabled: enabled === true });
    }
    case "update": {
      const { id, config } = payload;
      const errors = validateMcpConfig(id, config);
      if (Object.keys(errors).length > 0) {
        return operationError("invalid-config", "Invalid MCP server configuration", errors);
      }
      if (serverNameTaken(ctx, config.serverName, id)) {
        return operationError(
          "duplicate-server-name",
          `serverName "${config.serverName}" is already used by another MCP server`
        );
      }
      editPatchList(patchFile, (rows) => updateMcpConfig(rows, id, config));
      return ok({ updated: id });
    }
    case "probe": {
      const { id } = payload;
      let config;
      for (const entry of ctx.loader.entries()) {
        if (entry.options.group) continue;
        if (normalizeEntryId(entry.id) === id) {
          const raw = entry.options.config ?? {};
          config = {
            serverName: String(raw["serverName"] ?? ""),
            transport: raw["transport"] === "stdio" ? "stdio" : "streamable-http",
            url: typeof raw["url"] === "string" ? raw["url"] : void 0,
            command: typeof raw["command"] === "string" ? raw["command"] : void 0,
            args: Array.isArray(raw["args"]) ? raw["args"] : void 0,
            env: isRecord2(raw["env"]) ? raw["env"] : void 0,
            cwd: typeof raw["cwd"] === "string" ? raw["cwd"] : void 0,
            headers: isRecord2(raw["headers"]) ? raw["headers"] : void 0
          };
          break;
        }
      }
      if (config === void 0) {
        return fail("not-found", `No MCP server entry with id "${id}"`);
      }
      const result = await probeServer(config);
      return ok(result);
    }
    default:
      return fail("unknown-endpoint", `Unknown endpoint ${String(endpoint)}`);
  }
}
function operationError(code, message, fields) {
  return fail(code, message, fields === void 0 ? {} : { fields });
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map

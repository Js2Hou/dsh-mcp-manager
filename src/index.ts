/**
 * dsh-mcp-manager — node half.
 *
 * A visual MCP manager for the DeepSeek Harness web GUI:
 *
 *  - enumerates every live `@deepseek-ai/dsh-mcp-client` instance (which MCP
 *    servers are installed, enabled, and their current lifecycle/connection
 *    status, including how many `mcp__<serverName>__*` tools are registered);
 *  - adds / removes / enables / disables / edits MCP servers by editing the
 *    web profile's `cordis.patch.yml` (the harness HMR watcher hot-reloads
 *    the tree, so changes apply live without a restart);
 *  - runs an independent live connectivity probe per server on demand.
 *
 * The browser half talks to this host half over a loopback-only Connection RPC
 * channel (`/mcp-manager`).
 *
 * Config (row config in cordis.patch.yml; all optional):
 *   patchFile   absolute path of the user patch layer to edit
 *               (default: $DSH_HOME/profiles/web/cordis.patch.yml)
 * @module dsh-mcp-manager
 */
import { existsSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
// Type-only: loads the `Context { connection }` declaration merge into the program.
import type {} from '@deepseek-ai/dsh-client-connection'
import { RPC_CHANNEL, type McpServerInfo } from './shared.ts'
import {
  addMcpRow,
  editPatchList,
  isUserManaged,
  readPatchList,
  removeMcpRow,
  resolvePatchPath,
  setMcpEnabled,
  updateMcpConfig,
} from './patch.ts'
import { entryIdTaken, listMcpServers, normalizeEntryId, serverNameTaken } from './status.ts'
import { probeServer } from './probe.ts'
import { validateMcpConfig } from './validate.ts'
import type { McpEndpoint, McpProbeResult, McpServerConfig } from './shared.ts'

/** Stable plugin id for loader rows. */
export const name = 'mcp-manager'

/** Required services: the Connection RPC registry, the loader tree, tools. */
export const inject = ['connection', 'loader', 'tools']

/** Raw row config — every field defaults in code. */
export interface McpManagerRowConfig {
  patchFile?: string
}

/** RPC envelope (shape of `RpcResult` from dsh-host-apiproxy). */
type RpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details: Record<string, unknown> } }

function ok<T>(value: T): RpcResult<T> {
  return { ok: true, value }
}

function fail(code: string, message: string, details: Record<string, unknown> = {}): RpcResult<never> {
  return { ok: false, error: { code, message, details } }
}

/** Patch-info snapshot shown in the panel footer. */
interface PatchInfo {
  path: string
  exists: boolean
}

/**
 * Plugin body: register the RPC channel and dispatch MCP management commands.
 * @param ctx - plugin context.
 * @param rawConfig - raw row config (optional).
 */
export function apply(ctx: Context, rawConfig?: McpManagerRowConfig): void {
  const patchFile = resolvePatchPath(rawConfig?.patchFile)
  const logger = ctx.logger('mcp-manager')

  ctx.effect(() => {
    // The generic RPC channel's declared envelope is the closed api-map
    // `RpcError` union; this plugin-owned channel speaks its own open error
    // codes, so the handler is cast at the boundary (wire envelope unchanged).
    const handler = (async (endpoint: string, payload: unknown) =>
      dispatch(ctx, patchFile, endpoint as McpEndpoint, payload)) as unknown as
      Parameters<typeof ctx.connection.rpc.handle>[1]
    const dispose = ctx.connection.rpc.handle(
      RPC_CHANNEL,
      handler,
      { authority: 'loopback' },
    )
    return () => { void dispose() }
  }, 'mcp-manager: rpc channel')

  logger.info('mcp-manager active (patch file: %s)', patchFile)
}

/** Route one RPC endpoint to its implementation. */
async function dispatch(
  ctx: Context,
  patchFile: string,
  endpoint: McpEndpoint,
  payload: unknown,
): Promise<RpcResult<unknown>> {
  switch (endpoint) {
    case 'list': {
      const rows = readPatchList(patchFile)
      const servers: McpServerInfo[] = listMcpServers(ctx, (id) => isUserManaged(rows, id))
      return ok({ servers })
    }
    case 'patchInfo': {
      return ok({ patch: { path: patchFile, exists: existsSync(patchFile) } satisfies PatchInfo })
    }
    case 'add': {
      const { id, config } = payload as { id: string; config: McpServerConfig }
      const errors = validateMcpConfig(id, config)
      if (Object.keys(errors).length > 0) {
        return operationError('invalid-config', 'Invalid MCP server configuration', errors)
      }
      if (entryIdTaken(ctx, id)) {
        return operationError('duplicate-id', `Entry id "${id}" is already in use`)
      }
      if (serverNameTaken(ctx, config.serverName)) {
        return operationError(
          'duplicate-server-name',
          `serverName "${config.serverName}" is already used by another MCP server`,
        )
      }
      editPatchList(patchFile, (rows) => addMcpRow(rows, id, config))
      return ok({ added: id })
    }
    case 'remove': {
      const { id } = payload as { id: string }
      editPatchList(patchFile, (rows) => removeMcpRow(rows, id))
      return ok({ removed: id })
    }
    case 'setEnabled': {
      const { id, enabled } = payload as { id: string; enabled: boolean }
      editPatchList(patchFile, (rows) => setMcpEnabled(rows, id, enabled === true))
      return ok({ id, enabled: enabled === true })
    }
    case 'update': {
      const { id, config } = payload as { id: string; config: McpServerConfig }
      const errors = validateMcpConfig(id, config)
      if (Object.keys(errors).length > 0) {
        return operationError('invalid-config', 'Invalid MCP server configuration', errors)
      }
      if (serverNameTaken(ctx, config.serverName, id)) {
        return operationError(
          'duplicate-server-name',
          `serverName "${config.serverName}" is already used by another MCP server`,
        )
      }
      editPatchList(patchFile, (rows) => updateMcpConfig(rows, id, config))
      return ok({ updated: id })
    }
    case 'probe': {
      const { id } = payload as { id: string }
      let config: McpServerConfig | undefined
      for (const entry of ctx.loader.entries()) {
        if (entry.options.group) continue
        if (normalizeEntryId(entry.id) === id) {
          const raw = (entry.options.config ?? {}) as Record<string, unknown>
          config = {
            serverName: String(raw['serverName'] ?? ''),
            transport: raw['transport'] === 'stdio' ? 'stdio' : 'streamable-http',
            url: typeof raw['url'] === 'string' ? raw['url'] : undefined,
            command: typeof raw['command'] === 'string' ? raw['command'] : undefined,
            args: Array.isArray(raw['args']) ? raw['args'] as string[] : undefined,
            env: isRecord(raw['env']) ? raw['env'] as Record<string, string> : undefined,
            cwd: typeof raw['cwd'] === 'string' ? raw['cwd'] : undefined,
            headers: isRecord(raw['headers']) ? raw['headers'] as Record<string, string> : undefined,
          }
          break
        }
      }
      if (config === undefined) {
        return fail('not-found', `No MCP server entry with id "${id}"`)
      }
      const result: McpProbeResult = await probeServer(config)
      return ok(result)
    }
    default:
      return fail('unknown-endpoint', `Unknown endpoint ${String(endpoint)}`)
  }
}

function operationError(
  code: string,
  message: string,
  fields?: Record<string, string>,
): RpcResult<never> {
  return fail(code, message, fields === undefined ? {} : { fields })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

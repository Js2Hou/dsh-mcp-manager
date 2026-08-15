/**
 * Loader/tools status enumeration for MCP server instances.
 *
 * Every MCP server is one `@deepseek-ai/dsh-mcp-client` plugin entry in the
 * loader composition. Its lifecycle phase (mirrored from the Cordis FiberState
 * const enum) plus the number of `mcp__<serverName>__*` tools it currently has
 * registered on the tool registry make up the observable "connection status":
 * a server that successfully connected and synchronized its tool list is
 * `active` with `toolCount > 0`; a disabled entry reports `pending`/`null`; a
 * failing server reports `failed`.
 *
 * @module dsh-mcp-manager/status
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: loads the `Context { tools }` and `Context { loader }`
// declaration merges into the program (runtime never imports these packages).
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import {
  MCP_CLIENT_PACKAGE,
  type FiberPhase,
  type McpServerConfig,
  type McpServerInfo,
} from './shared.ts'

/** Runtime mirror of the cross-package Cordis FiberState const enum. */
const FIBER_STATE = {
  PENDING: 0,
  LOADING: 1,
  ACTIVE: 2,
  FAILED: 3,
  DISPOSED: 4,
  UNLOADING: 5,
} as const

/**
 * The composed loader nests every row under the root include group, so tree
 * entry ids look like `include:<file-id>` (nested groups add more segments).
 * The user patch file addresses rows by their file-level id, so the plugin
 * strips the leading root-group segment for all id comparisons.
 */
export function normalizeEntryId(id: string): string {
  return id.startsWith('include:') ? id.slice('include:'.length) : id
}

/** Complete public projection of the Cordis Fiber states. */
const FIBER_PHASE: Record<number, FiberPhase> = {
  [FIBER_STATE.PENDING]: 'pending',
  [FIBER_STATE.LOADING]: 'loading',
  [FIBER_STATE.ACTIVE]: 'active',
  [FIBER_STATE.FAILED]: 'failed',
  [FIBER_STATE.DISPOSED]: null,
  [FIBER_STATE.UNLOADING]: 'unloading',
}

/** Normalize a raw mcp-client row config into the shared shape. */
function toServerConfig(raw: unknown): McpServerConfig {
  const cfg = (raw ?? {}) as Record<string, unknown>
  return {
    serverName: typeof cfg['serverName'] === 'string' ? cfg['serverName'] : '',
    transport: cfg['transport'] === 'stdio' ? 'stdio' : 'streamable-http',
    url: typeof cfg['url'] === 'string' ? cfg['url'] : undefined,
    command: typeof cfg['command'] === 'string' ? cfg['command'] : undefined,
    args: Array.isArray(cfg['args']) ? (cfg['args'] as string[]) : undefined,
    env: isRecord(cfg['env']) ? (cfg['env'] as Record<string, string>) : undefined,
    cwd: typeof cfg['cwd'] === 'string' ? cfg['cwd'] : undefined,
    headers: isRecord(cfg['headers']) ? (cfg['headers'] as Record<string, string>) : undefined,
    toolCallTimeoutMs: typeof cfg['toolCallTimeoutMs'] === 'number'
      ? cfg['toolCallTimeoutMs']
      : undefined,
    failOnStartupError: typeof cfg['failOnStartupError'] === 'boolean'
      ? cfg['failOnStartupError']
      : undefined,
    reconnect: isRecord(cfg['reconnect']) ? cfg['reconnect'] as McpServerConfig['reconnect'] : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Count tools registered on the harness registry under a server namespace. */
export function countServerTools(ctx: Context, serverName: string): number {
  if (serverName === '') return 0
  const prefix = `mcp__${serverName}__`
  let count = 0
  for (const schema of ctx.tools.schemas()) {
    if (schema.name.startsWith(prefix)) count += 1
  }
  return count
}

/** Enumerate every live mcp-client instance with its status projection. */
export function listMcpServers(ctx: Context, userManaged: (id: string) => boolean): McpServerInfo[] {
  const servers: McpServerInfo[] = []
  for (const entry of ctx.loader.entries()) {
    if (entry.options.group) continue
    if (entry.options.name !== MCP_CLIENT_PACKAGE) continue
    const config = toServerConfig(entry.options.config)
    const phase = entry.fiber === undefined ? null : FIBER_PHASE[entry.fiber.state] ?? null
    const id = normalizeEntryId(entry.id)
    servers.push({
      ...config,
      id,
      enabled: !entry.disabled,
      fiberPhase: phase,
      toolCount: countServerTools(ctx, config.serverName),
      userManaged: userManaged(id),
    })
  }
  return servers
}

/** Whether a serverName is already taken by a live mcp-client instance. */
export function serverNameTaken(ctx: Context, serverName: string, exceptId?: string): boolean {
  for (const entry of ctx.loader.entries()) {
    if (entry.options.group) continue
    if (entry.options.name !== MCP_CLIENT_PACKAGE) continue
    // Compare file-level ids (tree ids carry the `include:` root prefix).
    if (exceptId !== undefined && normalizeEntryId(entry.id) === exceptId) continue
    const raw = (entry.options.config ?? {}) as Record<string, unknown>
    if (raw['serverName'] === serverName) return true
  }
  return false
}

/** Whether a loader entry id is already taken (across all plugins). */
export function entryIdTaken(ctx: Context, id: string, exceptId?: string): boolean {
  for (const entry of ctx.loader.entries()) {
    if (normalizeEntryId(entry.id) === id && entry.id !== exceptId) return true
  }
  return false
}

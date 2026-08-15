/**
 * Types and constants shared by the host half and the client half of the
 * dsh-mcp-manager plugin. This module is type-only for the client build
 * (values are used by the host only, the client imports types).
 *
 * @module dsh-mcp-manager/shared
 */

/** The package that implements an MCP server bridge in the harness. */
export const MCP_CLIENT_PACKAGE = '@deepseek-ai/dsh-mcp-client'

/** Logical Connection RPC channel registered by the host half. */
export const RPC_CHANNEL = '/mcp-manager'

/** Supported MCP transports. */
export type McpTransport = 'stdio' | 'streamable-http'

/** Fiber lifecycle phase mirror of the Cordis FiberState const enum. */
export type FiberPhase =
  | 'pending'
  | 'loading'
  | 'active'
  | 'failed'
  | 'unloading'
  | null

/** A user-editable MCP server configuration (subset of the mcp-client schema). */
export interface McpServerConfig {
  /** Model-facing namespace for this server's tools (`mcp__<serverName>__*`). */
  serverName: string
  /** Transport kind. */
  transport: McpTransport
  /** streamable-http: server URL. */
  url?: string
  /** stdio: executable to spawn. */
  command?: string
  /** stdio: arguments passed to the command. */
  args?: string[]
  /** stdio: extra environment variables. */
  env?: Record<string, string>
  /** stdio: working directory of the child process. */
  cwd?: string
  /** streamable-http: extra request headers. */
  headers?: Record<string, string>
  /** Per-callTool timeout in ms (default 60000). */
  toolCallTimeoutMs?: number
  /** Reject activation when the initial connection/sync fails. */
  failOnStartupError?: boolean
  /** Reconnect policy. */
  reconnect?: {
    enabled?: boolean
    initialDelayMs?: number
    maxDelayMs?: number
    maxAttempts?: number
  }
}

/** Full server snapshot the host exposes to the client. */
export interface McpServerInfo extends McpServerConfig {
  /** Loader entry id of the mcp-client plugin instance. */
  id: string
  /** Whether the entry is enabled in the loader composition. */
  enabled: boolean
  /** Current loader fiber phase (undefined entry → null). */
  fiberPhase: FiberPhase
  /** Number of `mcp__<serverName>__*` tools currently registered. */
  toolCount: number
  /** true when this server is defined in the user patch layer (removable). */
  userManaged: boolean
}

/** Live connectivity probe result. */
export interface McpProbeResult {
  ok: boolean
  latencyMs: number
  toolCount?: number
  error?: string
}

/** Payload for the `add` / `update` RPC endpoints. */
export interface McpUpsertPayload {
  id: string
  config: McpServerConfig
}

/** RPC endpoints understood by the host channel handler. */
export type McpEndpoint =
  | 'list'
  | 'add'
  | 'remove'
  | 'setEnabled'
  | 'update'
  | 'probe'
  | 'patchInfo'

/** Server-side validation errors, keyed by field for inline form display. */
export type McpFieldErrors = Partial<Record<keyof McpServerConfig | 'id', string>>

/** Host reply envelope for a failed operation. */
export interface McpOperationError {
  code: string
  message: string
  fields?: McpFieldErrors
}

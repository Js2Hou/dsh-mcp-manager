/**
 * Typed client for the `/mcp-manager` host RPC channel. Thin wrapper over
 * `ctx.connection.rpc.call` with the host's reply envelope.
 *
 * @module dsh-mcp-manager/client/rpc
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ClientConnectionRpc } from '@deepseek-ai/dsh-client-connection/client'
import { RPC_CHANNEL, type McpEndpoint } from '../shared.ts'

/** Minimal mirror of the host's RpcResult envelope. */
type RpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details: Record<string, unknown> } }

/**
 * The shipped client-connection types declare `ctx.connection` only on the
 * host side, yet the browser plugin provides the same service at runtime
 * (its `apply` docstring). Access it through a local structural cast.
 */
function connectionRpcOf(ctx: ClientContext): ClientConnectionRpc {
  const connection = (ctx as unknown as { connection?: { rpc: ClientConnectionRpc } }).connection
  if (connection === undefined) {
    throw new Error('connection service is unavailable (is @deepseek-ai/dsh-client-connection loaded?)')
  }
  return connection.rpc
}

/** Error thrown by {@link callRpc} with the host's code + field errors. */
export class McpManagerRpcError extends Error {
  readonly code: string
  readonly fields: Record<string, string> | undefined

  constructor(error: { code: string; message: string; details: Record<string, unknown> }) {
    super(`${error.code}: ${error.message}`)
    this.name = 'McpManagerRpcError'
    this.code = error.code
    this.fields = (error.details?.['fields'] ?? undefined) as Record<string, string> | undefined
  }
}

/**
 * Call a host endpoint and return its value, throwing on failure.
 * @param ctx - client root context (provides `ctx.connection`).
 * @param endpoint - RPC endpoint name.
 * @param payload - endpoint payload.
 * @returns the endpoint's business value.
 */
export async function callRpc<T>(
  ctx: ClientContext,
  endpoint: McpEndpoint,
  payload?: unknown,
): Promise<T> {
  const raw = await connectionRpcOf(ctx).call(RPC_CHANNEL, endpoint, payload ?? null)
  const result = raw as unknown as RpcResult<T>
  if (result.ok) return result.value
  throw new McpManagerRpcError(result.error)
}

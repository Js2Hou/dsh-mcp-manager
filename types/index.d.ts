/**
 * Type declarations for the host half of `@js2hou/dsh-mcp-manager`.
 *
 * Hand-written and dependency-free on purpose: this package resolves its
 * `@deepseek-ai/*` types from a local harness checkout at build time, and the
 * published harness build ships no `.d.ts` files, so emitting declarations
 * from source is not reproducible across machines. `ctx` is typed `unknown` to
 * keep this file importable by any TypeScript consumer without resolving
 * optional peer packages; at runtime it is the Cordis context provided by the
 * harness loader.
 *
 * @module @js2hou/dsh-mcp-manager
 */

/** Stable plugin id used for loader rows. */
export declare const name: string

/** Services the host half requires (connection, loader, tools). */
export declare const inject: readonly string[]

/** Row config accepted by the host half (`apply`'s second argument). */
export interface McpManagerRowConfig {
  /**
   * Absolute path of the user patch layer to edit.
   * Defaults to `$DSH_HOME/profiles/<active-profile>/cordis.patch.yml`.
   */
  patchFile?: string
}

/**
 * Host plugin body: mounts the browser half's RPC route and registers the MCP
 * management endpoints.
 * @param ctx - Cordis context provided by the harness loader.
 * @param rawConfig - raw row config from `cordis.patch.yml`.
 */
export declare function apply(ctx: unknown, rawConfig?: McpManagerRowConfig): void

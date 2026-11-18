/**
 * Type declarations for the browser half (`@js2hou/dsh-mcp-manager/client`).
 * Hand-written and dependency-free (see `../index.d.ts` for the rationale):
 * `ctx` is the Cordis client context, typed `unknown` so the declaration
 * needs no optional peer packages at consumer resolution time.
 *
 * @module @js2hou/dsh-mcp-manager/client
 */

/** Services the browser half requires (slots, connection, locale). */
export declare const inject: readonly string[]

/**
 * Browser plugin body: registers the Settings → MCP section, the zh/en locale
 * dictionaries, and the panel stylesheet.
 * @param ctx - Cordis client context provided by the shell.
 */
export declare function apply(ctx: unknown): void

/**
 * The `!!js` YAML expression dialect, as this plugin sees it.
 *
 * The harness loader lets a patch file carry JavaScript expression nodes
 * (`!!js <expr>` in YAML, parsed into `{__jsExpr}`) that it evaluates when an
 * entry starts. Two different configs exist for the same entry and it matters
 * which one you read:
 *
 *  - `entry.options.config` — the **authored** tree. Expression nodes are still
 *    `{__jsExpr}` objects here; this is what the patch file contains and what
 *    must be written back so an edit does not destroy the expression.
 *  - `entry.fiber.config` — the **evaluated** tree (the loader runs its
 *    `internal/config` waterfall, then schema resolution, before starting the
 *    plugin). This is what the mcp-client instance actually connects with.
 *
 * This module is the single place that knows how to detect, render and rebuild
 * expression nodes, so every other module can treat both shapes uniformly.
 * It deliberately imports no `@deepseek-ai/*` package at runtime: the plugin may
 * be installed anywhere (e.g. via a `link:`), where bare `@deepseek-ai`
 * specifiers are not resolvable from its real path.
 *
 * @module dsh-mcp-manager/jsexpr
 */
import type { McpServerConfig, McpStoredConfig, McpStoredValue } from './shared.ts'

/** An unevaluated loader `!!js` expression node (`!!js <expr>` in YAML). */
export interface JsExprNode {
  __jsExpr: unknown
}

/** An expression node rebuilt from panel text — the expression is a string. */
export interface StoredJsExpr {
  __jsExpr: string
}

/**
 * Text prefix the panel uses to show — and hand back — an expression node.
 * It matches the YAML scalar the loader writes, so what the panel displays is
 * what the patch file contains.
 */
export const JS_EXPR_PREFIX = '!!js '

/**
 * True when a value is a loader `!!js` expression node.
 *
 * Mirrors `isJsExpr` from `@deepseek-ai/cordis-plugin-loader` (the harness's
 * own `cordis-plugin-include` uses it as the `!!js` yaml predicate), replicated
 * inline for the portability reason in the module doc.
 */
export function isJsExpr(value: unknown): value is JsExprNode {
  return value instanceof Object && '__jsExpr' in value
}

/** A plain string-keyed record — excluding arrays and expression nodes. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !isJsExpr(value)
}

/** Render one raw config value as panel text, keeping `!!js` source intact. */
export function toExprText(value: unknown): string {
  return isJsExpr(value) ? `${JS_EXPR_PREFIX}${String(value.__jsExpr).trim()}` : String(value)
}

/** Whether panel text denotes an expression rather than a literal value. */
export function isExprText(text: string): boolean {
  return text.startsWith(JS_EXPR_PREFIX)
}

/** Rebuild the expression node a panel text line came from. */
export function fromExprText(text: string): StoredJsExpr {
  return { __jsExpr: text.slice(JS_EXPR_PREFIX.length).trim() }
}

/**
 * Project a raw `env`/`headers` map for the panel: literal strings pass
 * through, expression nodes become `!!js <expr>` text.
 *
 * @param raw - the authored map (may contain expression nodes).
 * @returns the panel projection, or undefined when `raw` is not a map.
 */
export function toExprMap(raw: unknown): Record<string, string> | undefined {
  if (!isRecord(raw)) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' || isJsExpr(value)) out[key] = toExprText(value)
  }
  return out
}

/**
 * Inverse of {@link toExprMap}: turn panel text back into the on-disk shape, so
 * an `!!js <expr>` line survives an edit instead of being flattened into a
 * literal.
 *
 * @param map - the panel projection.
 * @returns the authored map, or undefined when `map` is undefined.
 */
export function fromExprMap(
  map: Record<string, string> | undefined,
): Record<string, McpStoredValue> | undefined {
  if (map === undefined) return undefined
  const out: Record<string, McpStoredValue> = {}
  for (const [key, value] of Object.entries(map)) {
    out[key] = isExprText(value) ? fromExprText(value) : value
  }
  return out
}

/**
 * Convert a panel-supplied config into the on-disk shape.
 *
 * The panel shows an authored `!!js` expression as its `!!js <expr>` source
 * text; this rebuilds the node, so editing an unrelated field — or simply
 * saving the form again — does not flatten a server's credential expression
 * into a literal string.
 *
 * @param config - the config as the panel submitted it.
 * @returns the config to persist.
 */
export function toStoredConfig(config: McpServerConfig): McpStoredConfig {
  return {
    ...config,
    env: fromExprMap(config.env),
    headers: fromExprMap(config.headers),
  }
}

/**
 * Every path under `value` that still holds an unevaluated expression.
 *
 * Used to explain *why* a probe cannot run instead of sending a guess: an entry
 * that never started has no evaluated config, and its expressions cannot be
 * evaluated here (the loader owns that; see {@link isJsExpr}).
 *
 * @param value - the authored config.
 * @param path - accumulated path prefix (internal).
 * @param out - accumulated result (internal).
 * @returns dotted paths, e.g. `headers.Authorization`.
 */
export function unresolvedJsExprPaths(value: unknown, path = '', out: string[] = []): string[] {
  if (isJsExpr(value)) {
    out.push(path === '' ? '<root>' : path)
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      unresolvedJsExprPaths(item, `${path}[${String(index)}]`, out)
    })
    return out
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      unresolvedJsExprPaths(item, path === '' ? key : `${path}.${key}`, out)
    }
  }
  return out
}

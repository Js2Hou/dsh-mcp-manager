/**
 * Inlined `!!js` config interpolation for the host half.
 *
 * The loader stores the user patch layer's raw config tree on each entry
 * (`entry.options.config`): YAML `!!js` scalars stay serialized as
 * `{ __jsExpr: "<expression>" }` nodes. The loader only interpolates the config
 * it hands to the plugin at runtime — it never writes the evaluated values
 * back. Anything reading `entry.options.config` (the connection probe, the
 * panel's server list) must therefore interpolate it first, or it will pass
 * `{ __jsExpr }` objects to the MCP SDK (which stringifies them to
 * `[object Object]`, producing misleading auth errors).
 *
 * Mirrors `interpolate` / `evaluate` from `@deepseek-ai/cordis-plugin-loader`
 * (the harness evaluates expressions against the loader context scope with a
 * sloppy-mode `with (ctx)`). Replicated inline so the host half keeps zero
 * runtime imports of `@deepseek-ai` packages — the plugin may be installed
 * anywhere (e.g. via a `link:`), where bare specifiers may not resolve.
 *
 * @module dsh-mcp-manager/interpolate
 */
import type { Context } from '@deepseek-ai/cordis'

/** Whether a value is a serialized loader `!!js` expression node. */
export function isJsExpr(value: unknown): value is { __jsExpr: string } {
  return typeof value === 'object' && value !== null && '__jsExpr' in value
}

/**
 * Evaluate one `!!js` expression against the loader context scope.
 * Uses a `Function` body (sloppy mode) so the `with` scope mirrors the
 * loader's own evaluator; the expression may reference globals such as
 * `process` and context services.
 * @param ctx - loader context used as the `with` scope.
 * @param expr - the JavaScript expression text.
 * @returns the evaluated value.
 */
function evaluateJsExpr(ctx: Context, expr: string): unknown {
  const evaluate = new Function('ctx', 'expr', 'with (ctx) { return eval(expr) }') as
    (scope: Context, expression: string) => unknown
  return evaluate(ctx, expr)
}

/**
 * Recursively replace `!!js` nodes with evaluated values (mirrors the loader's
 * `interpolate`). An expression that throws evaluates to `undefined`; the
 * property is then omitted from the result so a broken expression cannot leak
 * a serialized node into the MCP SDK call.
 * @param ctx - loader context used as the `with` scope.
 * @param value - raw config (or any subtree of it).
 * @returns the interpolated value.
 */
export function interpolateConfig(ctx: Context, value: unknown): unknown {
  if (isJsExpr(value)) {
    try {
      return evaluateJsExpr(ctx, value.__jsExpr)
    } catch {
      return undefined
    }
  }
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value
      .map((item) => interpolateConfig(ctx, item))
      .filter((item) => item !== undefined)
  }
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    const interpolated = interpolateConfig(ctx, item)
    if (interpolated !== undefined) out[key] = interpolated
  }
  return out
}

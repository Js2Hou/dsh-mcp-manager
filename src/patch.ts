/**
 * User patch-layer editor for the web profile's `cordis.patch.yml`.
 *
 * MCP servers live as `@deepseek-ai/dsh-mcp-client` plugin entries composed
 * into the loader tree. The user-editable layer is the profile patch file; the
 * harness watches it (HMR) and hot-reloads the tree when it changes, so every
 * edit here is applied live without a restart.
 *
 * The file is a top-level YAML array of loader patch entries in the
 * `cordis-plugin-include` dialect:
 *   - `{ insert: [ {id, name, config} ] }`  — append new entries (id-less insert
 *     appends to the root list);
 *   - `{ id, name, config?, disabled? }`     — override/disable a composed entry;
 *   - `!!js` scalar expressions round-trip unchanged.
 *
 * @module dsh-mcp-manager/patch
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import type { McpServerConfig } from './shared.ts'

/**
 * Mirrors `isJsExpr` from @deepseek-ai/cordis-plugin-loader (the harness's own
 * `cordis-plugin-include` uses it as the `!!js` yaml predicate). Replicated
 * inline so the host half has zero runtime imports of @deepseek-ai packages —
 * the plugin may be installed anywhere (e.g. via a `link:`), where bare
 * @deepseek-ai specifiers may not be resolvable from its real path.
 */
function isJsExpr(value: unknown): value is { __jsExpr: unknown } {
  return value instanceof Object && '__jsExpr' in value
}

/**
 * Mirrors `resolveDshHome` from @deepseek-ai/dsh-home-paths (same precedence:
 * an explicit configured path, `$DSH_HOME`, then `~/.dsh`). Replicated inline
 * for the same portability reason as {@link isJsExpr}.
 */
function resolveDshHome(configured?: string): string {
  if (configured !== undefined && configured.trim() !== '') return configured.trim()
  const env = process.env['DSH_HOME']
  if (env !== undefined && env.trim() !== '') return env.trim()
  return join(homedir(), '.dsh')
}

/** A parsed patch row: either a top-level entry row or an insert row. */
interface PatchRow {
  /** Row-level id (top-level rows only). */
  id?: string
  /** Module specifier (top-level rows only). */
  name?: string
  /** Row-level config (top-level rows only). */
  config?: unknown
  /** Row-level disabled flag (top-level rows only). */
  disabled?: boolean
  /** Insert list (insert rows only). */
  insert?: Array<Record<string, unknown>>
  [key: string]: unknown
}

/**
 * The entry-list YAML dialect used by the harness include: plain JSON schema
 * extended with a `!!js` scalar type that round-trips expression nodes
 * (mirrors the dialect `dsh-app-boot` mounts).
 */
const JsExprType = new yaml.Type('tag:yaml.org,2002:js', {
  kind: 'scalar',
  resolve: (data: unknown) => typeof data === 'string',
  construct: (data: unknown) => ({ __jsExpr: data }),
  predicate: isJsExpr,
  represent: (data: unknown) => (data as { __jsExpr?: unknown })['__jsExpr'],
})

const ENTRY_LIST_SCHEMA = yaml.JSON_SCHEMA.extend(JsExprType)

/** Header comment written ahead of the managed entry rows. */
const PATCH_HEADER = `# MCP servers managed by the dsh-mcp-manager plugin.
# Format: a top-level YAML array of loader patch entries (\`!!js\` expressions
# allowed). Edit here, or use the MCP Manager panel in the web GUI.
`

/** Resolve the user patch file for the running profile (config override wins). */
export function resolvePatchPath(configured?: string): string {
  if (configured !== undefined && configured.trim() !== '') return configured.trim()
  return join(resolveDshHome(), 'profiles', 'web', 'cordis.patch.yml')
}

/** Read and parse the patch file; a missing file yields an empty list. */
export function readPatchList(file: string): PatchRow[] {
  if (!existsSync(file)) return []
  const content = readFileSync(file, 'utf8')
  const trimmed = content.trim()
  if (trimmed === '') return []
  const parsed = yaml.load(content, { schema: ENTRY_LIST_SCHEMA })
  if (parsed === undefined || parsed === null) return []
  if (!Array.isArray(parsed)) throw new Error(`patch file ${file} must be a top-level array`)
  return parsed as PatchRow[]
}

/** Serialize and write the patch list, preserving `!!js` expressions. */
export function writePatchList(file: string, rows: PatchRow[]): void {
  const body = rows.length > 0 ? yaml.dump(rows, { schema: ENTRY_LIST_SCHEMA, lineWidth: 120 }) : '[]\n'
  writeFileSync(file, `${PATCH_HEADER}${body}`, 'utf8')
}

/** Apply an edit function and persist; returns the rows after the edit. */
export function editPatchList(
  file: string,
  edit: (rows: PatchRow[]) => PatchRow[],
): PatchRow[] {
  const next = edit(readPatchList(file))
  writePatchList(file, next)
  return next
}

/** Whether any row (top-level or inside an insert list) carries the id. */
export function patchHasId(rows: PatchRow[], id: string): boolean {
  return rows.some((row) =>
    row.id === id || (Array.isArray(row.insert) && row.insert.some((item) => item['id'] === id)),
  )
}

/** Find the in-patch location of an entry id. */
type Location =
  | { kind: 'row'; row: PatchRow }
  | { kind: 'insert'; row: PatchRow; item: Record<string, unknown> }
  | undefined

function locate(rows: PatchRow[], id: string): Location {
  for (const row of rows) {
    if (row.id === id) return { kind: 'row', row }
    if (Array.isArray(row.insert)) {
      const item = row.insert.find((entry) => entry['id'] === id)
      if (item !== undefined) return { kind: 'insert', row, item }
    }
  }
  return undefined
}

/**
 * Append a new MCP server as an id-less insert row (the only patch form that
 * creates brand-new entries in the composed tree).
 */
export function addMcpRow(rows: PatchRow[], id: string, config: McpServerConfig): PatchRow[] {
  return [
    ...rows,
    { insert: [{ id, name: '@deepseek-ai/dsh-mcp-client', config }] },
  ]
}

/**
 * Remove every trace of an entry id: top-level rows and items inside insert
 * lists; an insert row that becomes empty is dropped.
 */
export function removeMcpRow(rows: PatchRow[], id: string): PatchRow[] {
  const next: PatchRow[] = []
  for (const row of rows) {
    if (row.id === id) continue
    if (Array.isArray(row.insert)) {
      const filtered = row.insert.filter((item) => item['id'] !== id)
      if (filtered.length === 0) continue
      next.push({ ...row, insert: filtered })
      continue
    }
    next.push(row)
  }
  return next
}

/**
 * Enable/disable an entry. When the entry is defined in the user patch
 * (top-level or insert item) its own flag flips; otherwise a bundle-defined
 * entry is overridden with a matching `{id, name, disabled}` row (the patch
 * layer later in the stack wins).
 */
export function setMcpEnabled(
  rows: PatchRow[],
  id: string,
  enabled: boolean,
): PatchRow[] {
  const found = locate(rows, id)
  if (found === undefined) {
    return [...rows, { id, name: '@deepseek-ai/dsh-mcp-client', disabled: !enabled }]
  }
  if (found.kind === 'row') {
    return rows.map((row) =>
      row === found.row
        ? { ...row, disabled: enabled ? false : true }
        : row,
    )
  }
  const item = found.item
  return rows.map((row) =>
    row === found.row
      ? {
          ...row,
          insert: row.insert!.map((entry) =>
            entry === item ? { ...entry, disabled: enabled ? false : true } : entry,
          ),
        }
      : row,
  )
}

/**
 * Replace the config of an existing entry. When the entry is not in the user
 * patch (bundle-defined), a matching override row is appended.
 */
export function updateMcpConfig(
  rows: PatchRow[],
  id: string,
  config: McpServerConfig,
): PatchRow[] {
  const found = locate(rows, id)
  if (found === undefined) {
    return [...rows, { id, name: '@deepseek-ai/dsh-mcp-client', config }]
  }
  if (found.kind === 'row') {
    return rows.map((row) => (row === found.row ? { ...row, config } : row))
  }
  const item = found.item
  return rows.map((row) =>
    row === found.row
      ? {
          ...row,
          insert: row.insert!.map((entry) =>
            entry === item ? { ...entry, config } : entry,
          ),
        }
      : row,
  )
}

/** Whether an entry id is present in the user patch (removable/editable). */
export function isUserManaged(rows: PatchRow[], id: string): boolean {
  return patchHasId(rows, id)
}

/**
 * Regression tests for the `!!js` expression dialect helpers and for the
 * patch-file round-trip they exist to protect.
 *
 * Both defects these cover share one root cause: outside `patch.ts` the plugin
 * treated an authored `!!js` expression node as an ordinary value, so it
 * reached the MCP transport (which stringifies it to `[object Object]`) and the
 * edit form (which would then persist that literal over the real expression).
 *
 * Run with: pnpm test
 */
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  JS_EXPR_PREFIX,
  fromExprMap,
  fromExprText,
  isExprText,
  isJsExpr,
  isRecord,
  toExprMap,
  toExprText,
  toStoredConfig,
  unresolvedJsExprPaths,
} from '../src/jsexpr.ts'
import { readPatchList, updateMcpConfig, writePatchList } from '../src/patch.ts'
import { toServerConfig } from '../src/status.ts'

/** The expression the GitHub MCP row in the bug report used. */
const BEARER_EXPR = "('Bearer ' + (process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? ''))"

test('isJsExpr recognises only expression nodes', () => {
  assert.equal(isJsExpr({ __jsExpr: 'x' }), true)
  assert.equal(isJsExpr({ other: 1 }), false)
  assert.equal(isJsExpr('x'), false)
  assert.equal(isJsExpr(null), false)
  assert.equal(isJsExpr([]), false)
})

test('isRecord rejects expression nodes', () => {
  // The loader's own isRecord does this; the plugin's copy did not, which is
  // what let the node through as a plain record.
  assert.equal(isRecord({ a: 1 }), true)
  assert.equal(isRecord({ __jsExpr: BEARER_EXPR }), false)
  assert.equal(isRecord([]), false)
  assert.equal(isRecord(null), false)
})

test('expression text round-trips', () => {
  const text = toExprText({ __jsExpr: BEARER_EXPR })
  assert.equal(text, `${JS_EXPR_PREFIX}${BEARER_EXPR}`)
  assert.equal(isExprText(text), true)
  assert.deepEqual(fromExprText(text), { __jsExpr: BEARER_EXPR })
  assert.equal(isExprText('Bearer abc'), false)
})

test('literal values are not mistaken for expressions', () => {
  assert.equal(toExprText('Bearer abc'), 'Bearer abc')
  assert.equal(toExprText(60000), '60000')
  assert.deepEqual(fromExprMap({ Authorization: 'Bearer abc' }), { Authorization: 'Bearer abc' })
})

test('toExprMap projects nodes as text and passes literals through', () => {
  assert.deepEqual(
    toExprMap({ Authorization: { __jsExpr: BEARER_EXPR }, Accept: 'application/json' }),
    { Authorization: `${JS_EXPR_PREFIX}${BEARER_EXPR}`, Accept: 'application/json' },
  )
  assert.equal(toExprMap('not-a-map'), undefined)
  assert.equal(toExprMap([1, 2]), undefined)
})

test('unresolvedJsExprPaths names every unevaluated expression', () => {
  assert.deepEqual(unresolvedJsExprPaths({ headers: { Authorization: { __jsExpr: 'x' } } }), [
    'headers.Authorization',
  ])
  assert.deepEqual(
    unresolvedJsExprPaths({ env: { A: { __jsExpr: 'x' }, B: 'literal' }, url: 'https://x' }),
    ['env.A'],
  )
  assert.deepEqual(unresolvedJsExprPaths({ a: 'literal' }), [])
})

test('toStoredConfig rebuilds expressions the panel edited as text', () => {
  const stored = toStoredConfig({
    serverName: 'github',
    transport: 'streamable-http',
    url: 'https://api.githubcopilot.com/mcp/',
    headers: {
      Authorization: `${JS_EXPR_PREFIX}${BEARER_EXPR}`,
      Accept: 'application/json',
    },
    env: { PLAIN: 'value' },
  })
  assert.deepEqual(stored.headers, {
    Authorization: { __jsExpr: BEARER_EXPR },
    Accept: 'application/json',
  })
  assert.deepEqual(stored.env, { PLAIN: 'value' })
})

test('a panel edit-save cycle preserves an authored !!js expression', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-mcp-manager-'))
  const file = join(dir, 'cordis.patch.yml')
  writeFileSync(
    file,
    [
      '- insert:',
      '    - id: mcp-github',
      "      name: '@deepseek-ai/dsh-mcp-client'",
      '      config:',
      '        serverName: github',
      '        transport: streamable-http',
      '        url: https://api.githubcopilot.com/mcp/',
      '        headers:',
      `          Authorization: !!js ${BEARER_EXPR}`,
      '      disabled: false',
      '',
    ].join('\n'),
    'utf8',
  )

  const rows = readPatchList(file)
  const row = rows[0]
  assert.ok(row?.insert)
  const authored = row.insert[0].config

  // What the panel is shown. Before the fix this was the raw node, which the
  // form rendered as "[object Object]".
  const panel = toServerConfig(authored)
  assert.equal(panel.headers?.Authorization, `${JS_EXPR_PREFIX}${BEARER_EXPR}`)

  // What the panel posts back after an edit elsewhere on the form.
  const edited = {
    ...panel,
    toolCallTimeoutMs: 120_000,
    headers: { ...panel.headers, Authorization: panel.headers?.Authorization ?? '' },
  }
  writePatchList(file, updateMcpConfig(rows, 'mcp-github', toStoredConfig(edited)))

  const text = readFileSync(file, 'utf8')
  assert.ok(
    text.includes('!!js'),
    `expected the !!js expression to survive the save, got:\n${text}`,
  )
  assert.ok(!text.includes('[object Object]'), 'the literal [object Object] must never be persisted')
  assert.equal(readPatchList(file)[0]?.insert?.[0]?.config?.headers?.Authorization?.__jsExpr, BEARER_EXPR)
})

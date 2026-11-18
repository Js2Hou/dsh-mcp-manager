/**
 * Unit tests for the inlined `!!js` config interpolation (issue #8).
 *
 * The loader stores raw `{ __jsExpr }` nodes on `entry.options.config`; the
 * probe and the panel list must interpolate them before using the config, or
 * the MCP SDK receives `[object Object]` headers and reports misleading auth
 * errors. Run with `node --test test/`.
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { interpolateConfig, isJsExpr } from '../lib/index.js'

/** The loader evaluates expressions against its context; tests need no services. */
const ctx = {}

test('isJsExpr recognizes serialized expression nodes', () => {
  assert.equal(isJsExpr({ __jsExpr: "'a'" }), true)
  assert.equal(isJsExpr({ plain: 1 }), false)
  assert.equal(isJsExpr(null), false)
  assert.equal(isJsExpr('text'), false)
})

test('interpolates a header expression (the issue #8 case)', () => {
  const raw = {
    serverName: 'github',
    transport: 'streamable-http',
    url: 'https://api.githubcopilot.com/mcp/',
    headers: { Authorization: { __jsExpr: "'Bearer ' + 'FAKE_TOKEN_XYZ'" } },
  }
  const out = interpolateConfig(ctx, raw)
  assert.deepEqual(out, {
    serverName: 'github',
    transport: 'streamable-http',
    url: 'https://api.githubcopilot.com/mcp/',
    headers: { Authorization: 'Bearer FAKE_TOKEN_XYZ' },
  })
})

test('interpolates env and args expressions for stdio servers', () => {
  const out = interpolateConfig(ctx, {
    serverName: 'demo',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', { __jsExpr: "'pkg-' + 'name'" }],
    env: { TOKEN: { __jsExpr: "'tok' + 123" } },
  })
  assert.deepEqual(out.args, ['-y', 'pkg-name'])
  assert.deepEqual(out.env, { TOKEN: 'tok123' })
})

test('a throwing expression is dropped instead of leaking the node', () => {
  const out = interpolateConfig(ctx, {
    headers: {
      Authorization: { __jsExpr: "'Bearer ' + missingVariable" },
      'X-Keep': 'plain',
    },
  })
  assert.deepEqual(out, { headers: { 'X-Keep': 'plain' } })
  assert.equal(Object.values(out.headers).some((v) => typeof v === 'object' && '__jsExpr' in v), false)
})

test('plain config passes through unchanged', () => {
  const raw = { serverName: 'zotero', transport: 'streamable-http', url: 'http://127.0.0.1:23120/mcp' }
  assert.deepEqual(interpolateConfig(ctx, raw), raw)
})
